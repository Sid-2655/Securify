const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ECertify Smart Contract", function () {
  let eCertify;
  let owner, student1, student2, institute1, institute2, thirdParty, unregistered;
  const ONE_DAY = 86400; // 24 hours in seconds
  const ONE_HOUR = 3600;

  beforeEach(async function () {
    // Get signers
    [owner, student1, student2, institute1, institute2, thirdParty, unregistered] = await ethers.getSigners();

    // Deploy contract
    const ECertify = await ethers.getContractFactory("ECertify");
    eCertify = await ECertify.deploy();
    await eCertify.waitForDeployment();
  });

  describe("Profile Management", function () {
    it("Should create a student profile", async function () {
      const tx = await eCertify.connect(student1).createProfile(
        "Alice Student",
        "QmHash123",
        false
      );

      await expect(tx).to.emit(eCertify, "ProfileCreated")
        .withArgs(student1.address, "Alice Student", false);

      const profile = await eCertify.getProfile(student1.address);
      expect(profile.name).to.equal("Alice Student");
      expect(profile.profilePicture).to.equal("QmHash123");
      expect(profile.exists).to.be.true;
      expect(profile.isInstitute).to.be.false;
    });

    it("Should create an institute profile", async function () {
      const tx = await eCertify.connect(institute1).createProfile(
        "MIT University",
        "QmHash456",
        true
      );

      await expect(tx).to.emit(eCertify, "ProfileCreated")
        .withArgs(institute1.address, "MIT University", true);

      const profile = await eCertify.getProfile(institute1.address);
      expect(profile.name).to.equal("MIT University");
      expect(profile.isInstitute).to.be.true;
    });

    it("Should not allow duplicate profile creation", async function () {
      await eCertify.connect(student1).createProfile("Alice", "QmHash", false);
      
      await expect(
        eCertify.connect(student1).createProfile("Alice2", "QmHash2", false)
      ).to.be.revertedWith("Profile already exists");
    });

    it("Should not allow empty name", async function () {
      await expect(
        eCertify.connect(student1).createProfile("", "QmHash", false)
      ).to.be.revertedWith("Name cannot be empty");
    });

    it("Should update profile", async function () {
      await eCertify.connect(student1).createProfile("Alice", "QmHash1", false);
      
      const tx = await eCertify.connect(student1).updateProfile("Alice Updated", "QmHash2");
      
      await expect(tx).to.emit(eCertify, "ProfileUpdated")
        .withArgs(student1.address, "Alice Updated", "QmHash2");
      
      const profile = await eCertify.getProfile(student1.address);
      expect(profile.name).to.equal("Alice Updated");
      expect(profile.profilePicture).to.equal("QmHash2");
    });

    it("Should not allow unregistered user to update profile", async function () {
      await expect(
        eCertify.connect(student1).updateProfile("Alice", "QmHash")
      ).to.be.revertedWith("User not registered");
    });

    it("Should not allow empty name on update", async function () {
      await eCertify.connect(student1).createProfile("Alice", "QmHash", false);
      
      await expect(
        eCertify.connect(student1).updateProfile("", "QmHash")
      ).to.be.revertedWith("Name cannot be empty");
    });
  });

  describe("Institute Linking", function () {
    beforeEach(async function () {
      await eCertify.connect(student1).createProfile("Alice", "QmHash", false);
      await eCertify.connect(institute1).createProfile("MIT", "QmHash", true);
    });

    it("Should link student to institute", async function () {
      const tx = await eCertify.connect(student1).linkToInstitute(institute1.address);
      
      await expect(tx).to.emit(eCertify, "StudentLinkedToInstitute")
        .withArgs(student1.address, institute1.address);
      
      const institute = await eCertify.getStudentInstitute(student1.address);
      expect(institute).to.equal(institute1.address);
    });

    it("Should not allow linking to non-institute", async function () {
      await eCertify.connect(student2).createProfile("Bob", "QmHash", false);
      
      await expect(
        eCertify.connect(student1).linkToInstitute(student2.address)
      ).to.be.revertedWith("Invalid institute address");
    });

    it("Should not allow linking to unregistered address", async function () {
      await expect(
        eCertify.connect(student1).linkToInstitute(unregistered.address)
      ).to.be.revertedWith("Invalid institute address");
    });

    it("Should not allow double linking", async function () {
      await eCertify.connect(student1).linkToInstitute(institute1.address);
      
      await eCertify.connect(institute2).createProfile("Harvard", "QmHash", true);
      
      await expect(
        eCertify.connect(student1).linkToInstitute(institute2.address)
      ).to.be.revertedWith("Student already linked to an institute");
    });

    it("Should return linked students for institute", async function () {
      await eCertify.connect(student1).linkToInstitute(institute1.address);
      
      await eCertify.connect(student2).createProfile("Bob", "QmHash", false);
      await eCertify.connect(student2).linkToInstitute(institute1.address);
      
      const students = await eCertify.getInstituteStudents(institute1.address);
      expect(students.length).to.equal(2);
      expect(students).to.include(student1.address);
      expect(students).to.include(student2.address);
    });

    it("Should not allow institute to link themselves", async function () {
      await expect(
        eCertify.connect(institute1).linkToInstitute(institute1.address)
      ).to.be.revertedWith("Only students can call this");
    });
  });

  describe("Certificate Management", function () {
    beforeEach(async function () {
      await eCertify.connect(student1).createProfile("Alice", "QmHash", false);
      await eCertify.connect(institute1).createProfile("MIT", "QmHash", true);
      await eCertify.connect(student1).linkToInstitute(institute1.address);
    });

    it("Should allow institute to upload certificate for student", async function () {
      const tx = await eCertify.connect(institute1).uploadCertificate(
        student1.address,
        "QmCertificateHash1",
        "B.Tech Degree"
      );
      
      await expect(tx).to.emit(eCertify, "CertificateUploaded")
        .withArgs(student1.address, 0, "QmCertificateHash1", "B.Tech Degree");
      
      const certificates = await eCertify.getStudentCertificates(student1.address);
      expect(certificates.length).to.equal(1);
      expect(certificates[0].ipfsHash).to.equal("QmCertificateHash1");
      expect(certificates[0].documentName).to.equal("B.Tech Degree");
      expect(certificates[0].isVerified).to.be.true; // Auto-verified when uploaded by institute
      expect(certificates[0].uploader).to.equal(institute1.address);
    });

    it("Should allow student to upload certificate (pending verification)", async function () {
      const tx = await eCertify.connect(student1).uploadCertificate(
        student1.address,
        "QmCertificateHash2",
        "Aadhar Card"
      );
      
      await expect(tx).to.emit(eCertify, "CertificateUploaded")
        .withArgs(student1.address, 0, "QmCertificateHash2", "Aadhar Card");
      
      const certificates = await eCertify.getStudentCertificates(student1.address);
      expect(certificates.length).to.equal(1);
      expect(certificates[0].isVerified).to.be.false;
      expect(certificates[0].uploader).to.equal(student1.address);
      
      // Check pending uploads
      const [students, indices] = await eCertify.getPendingUploads(institute1.address);
      expect(students.length).to.equal(1);
      expect(students[0]).to.equal(student1.address);
      expect(indices[0]).to.equal(0);
    });

    it("Should allow institute to verify student-uploaded certificate", async function () {
      await eCertify.connect(student1).uploadCertificate(
        student1.address,
        "QmCertificateHash3",
        "Diploma"
      );
      
      const tx = await eCertify.connect(institute1).verifyCertificate(student1.address, 0);
      
      await expect(tx).to.emit(eCertify, "CertificateVerified")
        .withArgs(student1.address, 0, institute1.address);
      
      const certificates = await eCertify.getStudentCertificates(student1.address);
      expect(certificates[0].isVerified).to.be.true;
      
      // Should no longer be pending
      const [students, indices] = await eCertify.getPendingUploads(institute1.address);
      expect(students.length).to.equal(0);
    });

    it("Should not allow non-linked institute to verify", async function () {
      await eCertify.connect(institute2).createProfile("Harvard", "QmHash", true);
      await eCertify.connect(student1).uploadCertificate(
        student1.address,
        "QmHash",
        "Certificate"
      );
      
      await expect(
        eCertify.connect(institute2).verifyCertificate(student1.address, 0)
      ).to.be.revertedWith("Only linked institute can perform this action");
    });

    it("Should not allow student to verify their own certificate", async function () {
      await eCertify.connect(student1).uploadCertificate(
        student1.address,
        "QmHash",
        "Certificate"
      );
      
      await expect(
        eCertify.connect(student1).verifyCertificate(student1.address, 0)
      ).to.be.revertedWith("Only linked institute can perform this action");
    });

    it("Should not allow verifying already verified certificate", async function () {
      await eCertify.connect(institute1).uploadCertificate(
        student1.address,
        "QmHash",
        "Certificate"
      );
      
      await expect(
        eCertify.connect(institute1).verifyCertificate(student1.address, 0)
      ).to.be.revertedWith("Certificate already verified");
    });

    it("Should return only verified certificates", async function () {
      // Upload verified certificate
      await eCertify.connect(institute1).uploadCertificate(
        student1.address,
        "QmHash1",
        "Verified Cert"
      );
      
      // Upload unverified certificate
      await eCertify.connect(student1).uploadCertificate(
        student1.address,
        "QmHash2",
        "Unverified Cert"
      );
      
      const [verifiedCerts, indices] = await eCertify.getVerifiedCertificates(student1.address);
      expect(verifiedCerts.length).to.equal(1);
      expect(verifiedCerts[0].documentName).to.equal("Verified Cert");
      expect(indices[0]).to.equal(0);
    });

    it("Should not allow empty IPFS hash", async function () {
      await expect(
        eCertify.connect(student1).uploadCertificate(
          student1.address,
          "",
          "Certificate"
        )
      ).to.be.revertedWith("IPFS hash cannot be empty");
    });

    it("Should not allow empty document name", async function () {
      await expect(
        eCertify.connect(student1).uploadCertificate(
          student1.address,
          "QmHash",
          ""
        )
      ).to.be.revertedWith("Document name cannot be empty");
    });

    it("Should not allow student to upload for another student", async function () {
      await eCertify.connect(student2).createProfile("Bob", "QmHash", false);
      
      await expect(
        eCertify.connect(student1).uploadCertificate(
          student2.address,
          "QmHash",
          "Certificate"
        )
      ).to.be.revertedWith("Students can only upload for themselves");
    });

    it("Should not allow institute to upload for unlinked student", async function () {
      await eCertify.connect(student2).createProfile("Bob", "QmHash", false);
      
      await expect(
        eCertify.connect(institute1).uploadCertificate(
          student2.address,
          "QmHash",
          "Certificate"
        )
      ).to.be.revertedWith("Institute not linked to this student");
    });

    it("Should handle multiple certificates correctly", async function () {
      await eCertify.connect(institute1).uploadCertificate(
        student1.address,
        "QmHash1",
        "Certificate 1"
      );
      await eCertify.connect(institute1).uploadCertificate(
        student1.address,
        "QmHash2",
        "Certificate 2"
      );
      await eCertify.connect(student1).uploadCertificate(
        student1.address,
        "QmHash3",
        "Certificate 3"
      );
      
      const certificates = await eCertify.getStudentCertificates(student1.address);
      expect(certificates.length).to.equal(3);
      
      const [verified, indices] = await eCertify.getVerifiedCertificates(student1.address);
      expect(verified.length).to.equal(2);
      expect(verified[0].documentName).to.equal("Certificate 1");
      expect(verified[1].documentName).to.equal("Certificate 2");
    });
  });

  describe("Access Control", function () {
    beforeEach(async function () {
      await eCertify.connect(student1).createProfile("Alice", "QmHash", false);
      await eCertify.connect(institute1).createProfile("MIT", "QmHash", true);
      await eCertify.connect(thirdParty).createProfile("Recruiter", "QmHash", false);
      await eCertify.connect(student1).linkToInstitute(institute1.address);
      
      // Upload a verified certificate
      await eCertify.connect(institute1).uploadCertificate(
        student1.address,
        "QmCertHash",
        "Degree"
      );
    });

    it("Should grant time-limited access to third party", async function () {
      const tx = await eCertify.connect(student1).grantAccess(
        thirdParty.address,
        ONE_DAY
      );
      
      const block = await ethers.provider.getBlock("latest");
      const expectedExpiry = block.timestamp + ONE_DAY;
      
      await expect(tx).to.emit(eCertify, "AccessGranted")
        .withArgs(student1.address, thirdParty.address, expectedExpiry);
      
      const hasAccess = await eCertify.hasAccess(student1.address, thirdParty.address);
      expect(hasAccess).to.be.true;
    });

    it("Should check access expiry correctly", async function () {
      await eCertify.connect(student1).grantAccess(thirdParty.address, ONE_DAY);
      
      // Fast forward time by 25 hours
      await ethers.provider.send("evm_increaseTime", [ONE_DAY + ONE_HOUR]);
      await ethers.provider.send("evm_mine", []);
      
      const hasAccess = await eCertify.hasAccess(student1.address, thirdParty.address);
      expect(hasAccess).to.be.false;
    });

    it("Should allow linked institute to always have access", async function () {
      const hasAccess = await eCertify.hasAccess(student1.address, institute1.address);
      expect(hasAccess).to.be.true;
    });

    it("Should revoke access", async function () {
      await eCertify.connect(student1).grantAccess(thirdParty.address, ONE_DAY);
      
      const tx = await eCertify.connect(student1).revokeAccess(thirdParty.address);
      
      await expect(tx).to.emit(eCertify, "AccessRevoked")
        .withArgs(student1.address, thirdParty.address);
      
      const hasAccess = await eCertify.hasAccess(student1.address, thirdParty.address);
      expect(hasAccess).to.be.false;
    });

    it("Should return students with valid access for requester", async function () {
      await eCertify.connect(student2).createProfile("Bob", "QmHash", false);
      await eCertify.connect(student2).linkToInstitute(institute1.address);
      
      await eCertify.connect(student1).grantAccess(thirdParty.address, ONE_DAY);
      await eCertify.connect(student2).grantAccess(thirdParty.address, ONE_DAY);
      
      const students = await eCertify.getStudentsWithAccess(thirdParty.address);
      expect(students.length).to.equal(2);
      expect(students).to.include(student1.address);
      expect(students).to.include(student2.address);
    });

    it("Should not allow granting access to yourself", async function () {
      await expect(
        eCertify.connect(student1).grantAccess(student1.address, ONE_DAY)
      ).to.be.revertedWith("Cannot grant access to yourself");
    });

    it("Should not allow granting access to unregistered user", async function () {
      await expect(
        eCertify.connect(student1).grantAccess(unregistered.address, ONE_DAY)
      ).to.be.revertedWith("Requester must be registered");
    });

    it("Should not allow zero duration", async function () {
      await expect(
        eCertify.connect(student1).grantAccess(thirdParty.address, 0)
      ).to.be.revertedWith("Duration must be greater than 0");
    });

    it("Should filter expired access from getStudentsWithAccess", async function () {
      await eCertify.connect(student2).createProfile("Bob", "QmHash", false);
      await eCertify.connect(student2).linkToInstitute(institute1.address);
      
      // Grant access with different durations
      await eCertify.connect(student1).grantAccess(thirdParty.address, ONE_DAY);
      await eCertify.connect(student2).grantAccess(thirdParty.address, ONE_HOUR);
      
      // Fast forward 2 hours
      await ethers.provider.send("evm_increaseTime", [ONE_HOUR * 2]);
      await ethers.provider.send("evm_mine", []);
      
      const students = await eCertify.getStudentsWithAccess(thirdParty.address);
      expect(students.length).to.equal(1);
      expect(students[0]).to.equal(student1.address);
    });

    it("Should allow re-granting access after expiry", async function () {
      await eCertify.connect(student1).grantAccess(thirdParty.address, ONE_HOUR);
      
      // Fast forward 2 hours
      await ethers.provider.send("evm_increaseTime", [ONE_HOUR * 2]);
      await ethers.provider.send("evm_mine", []);
      
      // Grant access again
      await eCertify.connect(student1).grantAccess(thirdParty.address, ONE_DAY);
      
      const hasAccess = await eCertify.hasAccess(student1.address, thirdParty.address);
      expect(hasAccess).to.be.true;
    });
  });

  describe("Institute Change", function () {
    beforeEach(async function () {
      await eCertify.connect(student1).createProfile("Alice", "QmHash", false);
      await eCertify.connect(institute1).createProfile("MIT", "QmHash", true);
      await eCertify.connect(institute2).createProfile("Harvard", "QmHash", true);
      await eCertify.connect(student1).linkToInstitute(institute1.address);
    });

    it("Should allow student to request institute change", async function () {
      const tx = await eCertify.connect(student1).requestInstituteChange(institute2.address);
      
      await expect(tx).to.emit(eCertify, "InstituteChangeRequested")
        .withArgs(student1.address, institute2.address);
      
      const [newInstitute, isPending] = await eCertify.getInstituteChangeRequest(student1.address);
      expect(newInstitute).to.equal(institute2.address);
      expect(isPending).to.be.true;
    });

    it("Should allow current institute to approve change", async function () {
      await eCertify.connect(student1).requestInstituteChange(institute2.address);
      
      const tx = await eCertify.connect(institute1).approveInstituteChange(student1.address);
      
      await expect(tx).to.emit(eCertify, "InstituteChangeApproved")
        .withArgs(student1.address, institute1.address, institute2.address);
      
      const newInstitute = await eCertify.getStudentInstitute(student1.address);
      expect(newInstitute).to.equal(institute2.address);
      
      // Check student is in new institute's list
      const students = await eCertify.getInstituteStudents(institute2.address);
      expect(students).to.include(student1.address);
      
      // Check student is removed from old institute's list
      const oldStudents = await eCertify.getInstituteStudents(institute1.address);
      expect(oldStudents).to.not.include(student1.address);
    });

    it("Should not allow non-linked institute to approve", async function () {
      await eCertify.connect(student1).requestInstituteChange(institute2.address);
      
      await expect(
        eCertify.connect(institute2).approveInstituteChange(student1.address)
      ).to.be.revertedWith("Only linked institute can perform this action");
    });

    it("Should not allow requesting change to same institute", async function () {
      await expect(
        eCertify.connect(student1).requestInstituteChange(institute1.address)
      ).to.be.revertedWith("Already linked to this institute");
    });

    it("Should not allow requesting change if not linked", async function () {
      await eCertify.connect(student2).createProfile("Bob", "QmHash", false);
      
      await expect(
        eCertify.connect(student2).requestInstituteChange(institute1.address)
      ).to.be.revertedWith("Student not linked to any institute");
    });

    it("Should not allow requesting change to invalid institute", async function () {
      await eCertify.connect(student2).createProfile("Bob", "QmHash", false);
      
      await expect(
        eCertify.connect(student1).requestInstituteChange(student2.address)
      ).to.be.revertedWith("Invalid institute address");
    });

    it("Should maintain certificate history after institute change", async function () {
      await eCertify.connect(institute1).uploadCertificate(
        student1.address,
        "QmHash1",
        "Old Institute Cert"
      );
      
      await eCertify.connect(student1).requestInstituteChange(institute2.address);
      await eCertify.connect(institute1).approveInstituteChange(student1.address);
      
      const certificates = await eCertify.getStudentCertificates(student1.address);
      expect(certificates.length).to.equal(1);
      expect(certificates[0].ipfsHash).to.equal("QmHash1");
    });

    it("Should clear request after approval", async function () {
      await eCertify.connect(student1).requestInstituteChange(institute2.address);
      await eCertify.connect(institute1).approveInstituteChange(student1.address);
      
      const [newInstitute, isPending] = await eCertify.getInstituteChangeRequest(student1.address);
      expect(newInstitute).to.equal(ethers.ZeroAddress);
      expect(isPending).to.be.false;
    });
  });

  describe("Edge Cases and Integration", function () {
    beforeEach(async function () {
      await eCertify.connect(student1).createProfile("Alice", "QmHash", false);
      await eCertify.connect(institute1).createProfile("MIT", "QmHash", true);
      await eCertify.connect(student1).linkToInstitute(institute1.address);
    });

    it("Should handle multiple certificates correctly", async function () {
      await eCertify.connect(institute1).uploadCertificate(
        student1.address,
        "QmHash1",
        "Certificate 1"
      );
      await eCertify.connect(institute1).uploadCertificate(
        student1.address,
        "QmHash2",
        "Certificate 2"
      );
      await eCertify.connect(student1).uploadCertificate(
        student1.address,
        "QmHash3",
        "Certificate 3"
      );
      
      const certificates = await eCertify.getStudentCertificates(student1.address);
      expect(certificates.length).to.equal(3);
      
      const [verified, indices] = await eCertify.getVerifiedCertificates(student1.address);
      expect(verified.length).to.equal(2);
    });

    it("Should handle access requests correctly with multiple requesters", async function () {
      await eCertify.connect(thirdParty).createProfile("Recruiter1", "QmHash", false);
      const recruiter2 = (await ethers.getSigners())[6];
      await eCertify.connect(recruiter2).createProfile("Recruiter2", "QmHash", false);
      
      await eCertify.connect(student1).grantAccess(thirdParty.address, ONE_DAY);
      await eCertify.connect(student1).grantAccess(recruiter2.address, ONE_DAY);
      
      const students1 = await eCertify.getStudentsWithAccess(thirdParty.address);
      const students2 = await eCertify.getStudentsWithAccess(recruiter2.address);
      
      expect(students1.length).to.equal(1);
      expect(students2.length).to.equal(1);
    });

    it("Should handle multiple pending uploads correctly", async function () {
      await eCertify.connect(student2).createProfile("Bob", "QmHash", false);
      await eCertify.connect(student2).linkToInstitute(institute1.address);
      
      await eCertify.connect(student1).uploadCertificate(
        student1.address,
        "QmHash1",
        "Cert 1"
      );
      await eCertify.connect(student2).uploadCertificate(
        student2.address,
        "QmHash2",
        "Cert 2"
      );
      
      const [students, indices] = await eCertify.getPendingUploads(institute1.address);
      expect(students.length).to.equal(2);
    });

    it("Should return empty array for no pending uploads", async function () {
      const [students, indices] = await eCertify.getPendingUploads(institute1.address);
      expect(students.length).to.equal(0);
      expect(indices.length).to.equal(0);
    });

    it("Should return empty array for no verified certificates", async function () {
      await eCertify.connect(student1).uploadCertificate(
        student1.address,
        "QmHash",
        "Unverified"
      );
      
      const [verified, indices] = await eCertify.getVerifiedCertificates(student1.address);
      expect(verified.length).to.equal(0);
      expect(indices.length).to.equal(0);
    });

    it("Should handle certificate upload with correct timestamp", async function () {
      const blockBefore = await ethers.provider.getBlock("latest");
      
      await eCertify.connect(institute1).uploadCertificate(
        student1.address,
        "QmHash",
        "Certificate"
      );
      
      const blockAfter = await ethers.provider.getBlock("latest");
      const certificates = await eCertify.getStudentCertificates(student1.address);
      
      expect(certificates[0].uploadTimestamp).to.be.at.least(blockBefore.timestamp);
      expect(certificates[0].uploadTimestamp).to.be.at.most(blockAfter.timestamp);
    });
  });
});
