// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ECertify
 * @dev Smart contract for blockchain-based certificate validation and storage
 * @notice Handles certificate uploads, verification, access control, and institute linking
 * @notice Certificates are stored on IPFS, only hashes are stored on-chain
 */
contract ECertify {
    // ============ STRUCTS ============
    
    /**
     * @dev User profile information
     */
    struct Profile {
        string name;
        string profilePicture; // IPFS hash
        bool exists;
        bool isInstitute;
    }
    
    /**
     * @dev Certificate document structure
     */
    struct Certificate {
        string ipfsHash;        // IPFS hash of the encrypted certificate
        string documentName;    // Name of the document (e.g., "Aadhar Card", "B.Tech Degree")
        address uploader;       // Address that uploaded the certificate
        bool isVerified;        // Whether the certificate is verified by institute
        uint256 uploadTimestamp; // Block timestamp when uploaded
    }
    
    /**
     * @dev Access request structure for time-based access control
     */
    struct AccessRequest {
        address requester;      // Third party requesting access
        uint256 expiryTime;     // Block timestamp when access expires
        bool isActive;          // Whether access is currently active
    }
    
    /**
     * @dev Institute change request structure
     */
    struct InstituteChangeRequest {
        address newInstitute;   // Address of the new institute
        bool isPending;         // Whether request is pending approval
    }
    
    // ============ STATE VARIABLES ============
    
    mapping(address => Profile) public profiles;
    mapping(address => address) public studentToInstitute; // student => institute
    mapping(address => address[]) public instituteToStudents; // institute => students[]
    mapping(address => Certificate[]) public studentCertificates; // student => certificates[]
    mapping(address => mapping(address => AccessRequest)) public accessRequests; // student => requester => AccessRequest
    mapping(address => address[]) public studentsWithAccess; // requester => students[] (for institutes to see who they have access to)
    mapping(address => InstituteChangeRequest) public instituteChangeRequests; // student => InstituteChangeRequest
    mapping(address => mapping(uint256 => bool)) public pendingUploads; // student => certificateIndex => isPending
    
    address[] public allStudents;
    address[] public allInstitutes;
    
    // ============ EVENTS ============
    
    event ProfileCreated(address indexed user, string name, bool isInstitute);
    event ProfileUpdated(address indexed user, string name, string profilePicture);
    event StudentLinkedToInstitute(address indexed student, address indexed institute);
    event CertificateUploaded(address indexed student, uint256 indexed certificateIndex, string ipfsHash, string documentName);
    event CertificateVerified(address indexed student, uint256 indexed certificateIndex, address indexed verifier);
    event AccessGranted(address indexed student, address indexed requester, uint256 expiryTime);
    event AccessRevoked(address indexed student, address indexed requester);
    event InstituteChangeRequested(address indexed student, address indexed newInstitute);
    event InstituteChangeApproved(address indexed student, address indexed oldInstitute, address indexed newInstitute);
    
    // ============ MODIFIERS ============
    
    modifier onlyRegistered() {
        require(profiles[msg.sender].exists, "User not registered");
        _;
    }
    
    modifier onlyStudent() {
        require(profiles[msg.sender].exists && !profiles[msg.sender].isInstitute, "Only students can call this");
        _;
    }
    
    modifier onlyInstitute() {
        require(profiles[msg.sender].exists && profiles[msg.sender].isInstitute, "Only institutes can call this");
        _;
    }
    
    modifier onlyLinkedInstitute(address student) {
        require(studentToInstitute[student] == msg.sender, "Only linked institute can perform this action");
        _;
    }
    
    // ============ PROFILE MANAGEMENT ============
    
    /**
     * @dev Create a new user profile (Student or Institute)
     * @param name User's name
     * @param profilePicture IPFS hash of profile picture
     * @param isInstitute Whether the user is an institute
     */
    function createProfile(
        string memory name,
        string memory profilePicture,
        bool isInstitute
    ) external {
        require(!profiles[msg.sender].exists, "Profile already exists");
        require(bytes(name).length > 0, "Name cannot be empty");
        
        profiles[msg.sender] = Profile({
            name: name,
            profilePicture: profilePicture,
            exists: true,
            isInstitute: isInstitute
        });
        
        if (isInstitute) {
            allInstitutes.push(msg.sender);
        } else {
            allStudents.push(msg.sender);
        }
        
        emit ProfileCreated(msg.sender, name, isInstitute);
    }
    
    /**
     * @dev Update user profile information
     * @param name New name
     * @param profilePicture New IPFS hash of profile picture
     */
    function updateProfile(
        string memory name,
        string memory profilePicture
    ) external onlyRegistered {
        require(bytes(name).length > 0, "Name cannot be empty");
        
        profiles[msg.sender].name = name;
        profiles[msg.sender].profilePicture = profilePicture;
        
        emit ProfileUpdated(msg.sender, name, profilePicture);
    }
    
    /**
     * @dev Get user profile information
     * @param user Address of the user
     * @return name User's name
     * @return profilePicture IPFS hash of profile picture
     * @return exists Whether profile exists
     * @return isInstitute Whether user is an institute
     */
    function getProfile(address user) external view returns (
        string memory name,
        string memory profilePicture,
        bool exists,
        bool isInstitute
    ) {
        Profile memory profile = profiles[user];
        return (profile.name, profile.profilePicture, profile.exists, profile.isInstitute);
    }
    
    // ============ INSTITUTE LINKING ============
    
    /**
     * @dev Link a student to an institute (called by student)
     * @param instituteAddress Address of the institute to link to
     */
    function linkToInstitute(address instituteAddress) external onlyStudent {
        require(profiles[instituteAddress].exists && profiles[instituteAddress].isInstitute, "Invalid institute address");
        require(studentToInstitute[msg.sender] == address(0), "Student already linked to an institute");
        
        studentToInstitute[msg.sender] = instituteAddress;
        instituteToStudents[instituteAddress].push(msg.sender);
        
        emit StudentLinkedToInstitute(msg.sender, instituteAddress);
    }
    
    /**
     * @dev Get the institute address for a student
     * @param student Address of the student
     * @return Institute address (address(0) if not linked)
     */
    function getStudentInstitute(address student) external view returns (address) {
        return studentToInstitute[student];
    }
    
    /**
     * @dev Get all students linked to an institute
     * @param institute Address of the institute
     * @return Array of student addresses
     */
    function getInstituteStudents(address institute) external view returns (address[] memory) {
        return instituteToStudents[institute];
    }
    
    // ============ CERTIFICATE MANAGEMENT ============
    
    /**
     * @dev Upload a certificate (can be called by student or institute)
     * @notice If uploaded by institute, certificate is auto-verified
     * @notice If uploaded by student, certificate requires verification
     * @param studentAddress Address of the student (for institutes) or msg.sender (for students)
     * @param ipfsHash IPFS hash of the encrypted certificate
     * @param documentName Name of the document
     * @return certificateIndex Index of the uploaded certificate
     */
    function uploadCertificate(
        address studentAddress,
        string memory ipfsHash,
        string memory documentName
    ) external onlyRegistered returns (uint256) {
        require(bytes(ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(bytes(documentName).length > 0, "Document name cannot be empty");
        
        // If called by institute, must be linked to the student
        if (profiles[msg.sender].isInstitute) {
            require(studentToInstitute[studentAddress] == msg.sender, "Institute not linked to this student");
        } else {
            // If called by student, must be the student themselves
            require(studentAddress == msg.sender, "Students can only upload for themselves");
        }
        
        uint256 certificateIndex = studentCertificates[studentAddress].length;
        
        Certificate memory newCertificate = Certificate({
            ipfsHash: ipfsHash,
            documentName: documentName,
            uploader: msg.sender,
            isVerified: profiles[msg.sender].isInstitute, // Auto-verified if uploaded by institute
            uploadTimestamp: block.timestamp
        });
        
        studentCertificates[studentAddress].push(newCertificate);
        
        // If uploaded by student, mark as pending verification
        if (!profiles[msg.sender].isInstitute) {
            pendingUploads[studentAddress][certificateIndex] = true;
        }
        
        emit CertificateUploaded(studentAddress, certificateIndex, ipfsHash, documentName);
        
        return certificateIndex;
    }
    
    /**
     * @dev Verify a certificate (only called by linked institute)
     * @param studentAddress Address of the student
     * @param certificateIndex Index of the certificate to verify
     */
    function verifyCertificate(
        address studentAddress,
        uint256 certificateIndex
    ) external onlyLinkedInstitute(studentAddress) {
        require(
            certificateIndex < studentCertificates[studentAddress].length,
            "Invalid certificate index"
        );
        require(
            !studentCertificates[studentAddress][certificateIndex].isVerified,
            "Certificate already verified"
        );
        
        studentCertificates[studentAddress][certificateIndex].isVerified = true;
        pendingUploads[studentAddress][certificateIndex] = false;
        
        emit CertificateVerified(studentAddress, certificateIndex, msg.sender);
    }
    
    /**
     * @dev Get all certificates for a student
     * @param studentAddress Address of the student
     * @return certificates Array of Certificate structs
     */
    function getStudentCertificates(address studentAddress) external view returns (Certificate[] memory) {
        return studentCertificates[studentAddress];
    }
    
    /**
     * @dev Get verified certificates for a student
     * @notice Only verified certificates appear in valid list
     * @param studentAddress Address of the student
     * @return verifiedCertificates Array of verified Certificate structs
     * @return indices Array of indices of verified certificates
     */
    function getVerifiedCertificates(address studentAddress) external view returns (
        Certificate[] memory verifiedCertificates,
        uint256[] memory indices
    ) {
        Certificate[] memory allCerts = studentCertificates[studentAddress];
        uint256 verifiedCount = 0;
        
        // Count verified certificates
        for (uint256 i = 0; i < allCerts.length; i++) {
            if (allCerts[i].isVerified) {
                verifiedCount++;
            }
        }
        
        // Create arrays
        verifiedCertificates = new Certificate[](verifiedCount);
        indices = new uint256[](verifiedCount);
        uint256 currentIndex = 0;
        
        // Populate arrays
        for (uint256 i = 0; i < allCerts.length; i++) {
            if (allCerts[i].isVerified) {
                verifiedCertificates[currentIndex] = allCerts[i];
                indices[currentIndex] = i;
                currentIndex++;
            }
        }
        
        return (verifiedCertificates, indices);
    }
    
    /**
     * @dev Get pending upload requests for an institute's students
     * @param instituteAddress Address of the institute
     * @return students Array of student addresses with pending uploads
     * @return certificateIndices Array of certificate indices that are pending
     */
    function getPendingUploads(address instituteAddress) external view returns (
        address[] memory students,
        uint256[] memory certificateIndices
    ) {
        address[] memory linkedStudents = instituteToStudents[instituteAddress];
        uint256 pendingCount = 0;
        
        // Count pending uploads
        for (uint256 i = 0; i < linkedStudents.length; i++) {
            address student = linkedStudents[i];
            Certificate[] memory certs = studentCertificates[student];
            for (uint256 j = 0; j < certs.length; j++) {
                if (pendingUploads[student][j]) {
                    pendingCount++;
                }
            }
        }
        
        // Create arrays
        students = new address[](pendingCount);
        certificateIndices = new uint256[](pendingCount);
        uint256 currentIndex = 0;
        
        // Populate arrays
        for (uint256 i = 0; i < linkedStudents.length; i++) {
            address student = linkedStudents[i];
            Certificate[] memory certs = studentCertificates[student];
            for (uint256 j = 0; j < certs.length; j++) {
                if (pendingUploads[student][j]) {
                    students[currentIndex] = student;
                    certificateIndices[currentIndex] = j;
                    currentIndex++;
                }
            }
        }
        
        return (students, certificateIndices);
    }
    
    // ============ ACCESS CONTROL ============
    
    /**
     * @dev Grant time-limited access to a third party (called by student)
     * @notice Access expires after the specified duration (typically 24 hours = 86400 seconds)
     * @param requesterAddress Address of the third party requesting access
     * @param durationInSeconds Duration of access in seconds (typically 24 hours = 86400)
     */
    function grantAccess(
        address requesterAddress,
        uint256 durationInSeconds
    ) external onlyStudent {
        require(profiles[requesterAddress].exists, "Requester must be registered");
        require(requesterAddress != msg.sender, "Cannot grant access to yourself");
        require(durationInSeconds > 0, "Duration must be greater than 0");
        
        uint256 expiryTime = block.timestamp + durationInSeconds;
        
        accessRequests[msg.sender][requesterAddress] = AccessRequest({
            requester: requesterAddress,
            expiryTime: expiryTime,
            isActive: true
        });
        
        // Add to requester's list of students they have access to
        bool alreadyExists = false;
        address[] memory existingAccess = studentsWithAccess[requesterAddress];
        for (uint256 i = 0; i < existingAccess.length; i++) {
            if (existingAccess[i] == msg.sender) {
                alreadyExists = true;
                break;
            }
        }
        if (!alreadyExists) {
            studentsWithAccess[requesterAddress].push(msg.sender);
        }
        
        emit AccessGranted(msg.sender, requesterAddress, expiryTime);
    }
    
    /**
     * @dev Check if a requester has valid access to a student's certificates
     * @notice Linked institutes always have access
     * @notice Third parties have access only if granted and not expired
     * @param studentAddress Address of the student
     * @param requesterAddress Address of the requester
     * @return hasAccess Whether the requester has valid access
     */
    function hasAccess(
        address studentAddress,
        address requesterAddress
    ) external view returns (bool) {
        // Linked institute always has access
        if (studentToInstitute[studentAddress] == requesterAddress) {
            return true;
        }
        
        AccessRequest memory request = accessRequests[studentAddress][requesterAddress];
        
        // Check if access is active and not expired
        if (!request.isActive) {
            return false;
        }
        
        // Check if expired
        if (block.timestamp > request.expiryTime) {
            return false;
        }
        
        return true;
    }
    
    /**
     * @dev Revoke access for a requester (called by student)
     * @param requesterAddress Address of the requester to revoke access from
     */
    function revokeAccess(address requesterAddress) external onlyStudent {
        require(accessRequests[msg.sender][requesterAddress].isActive, "Access not granted");
        
        accessRequests[msg.sender][requesterAddress].isActive = false;
        
        emit AccessRevoked(msg.sender, requesterAddress);
    }
    
    /**
     * @dev Get all students that a requester has access to
     * @notice Only returns students with active, non-expired access
     * @param requesterAddress Address of the requester
     * @return students Array of student addresses
     */
    function getStudentsWithAccess(address requesterAddress) external view returns (address[] memory) {
        address[] memory allAccess = studentsWithAccess[requesterAddress];
        address[] memory validAccess = new address[](allAccess.length);
        uint256 validCount = 0;
        
        // Filter only active and non-expired access
        for (uint256 i = 0; i < allAccess.length; i++) {
            address student = allAccess[i];
            AccessRequest memory request = accessRequests[student][requesterAddress];
            if (request.isActive && block.timestamp <= request.expiryTime) {
                validAccess[validCount] = student;
                validCount++;
            }
        }
        
        // Resize array
        address[] memory result = new address[](validCount);
        for (uint256 i = 0; i < validCount; i++) {
            result[i] = validAccess[i];
        }
        
        return result;
    }
    
    // ============ INSTITUTE CHANGE ============
    
    /**
     * @dev Request to change institute (called by student)
     * @param newInstituteAddress Address of the new institute
     */
    function requestInstituteChange(address newInstituteAddress) external onlyStudent {
        require(profiles[newInstituteAddress].exists && profiles[newInstituteAddress].isInstitute, "Invalid institute address");
        require(studentToInstitute[msg.sender] != address(0), "Student not linked to any institute");
        require(studentToInstitute[msg.sender] != newInstituteAddress, "Already linked to this institute");
        
        instituteChangeRequests[msg.sender] = InstituteChangeRequest({
            newInstitute: newInstituteAddress,
            isPending: true
        });
        
        emit InstituteChangeRequested(msg.sender, newInstituteAddress);
    }
    
    /**
     * @dev Approve institute change request (called by current institute)
     * @param studentAddress Address of the student requesting the change
     */
    function approveInstituteChange(address studentAddress) external onlyLinkedInstitute(studentAddress) {
        InstituteChangeRequest memory request = instituteChangeRequests[studentAddress];
        require(request.isPending, "No pending request");
        
        address oldInstitute = studentToInstitute[studentAddress];
        address newInstitute = request.newInstitute;
        
        // Remove student from old institute's list
        address[] storage oldStudents = instituteToStudents[oldInstitute];
        for (uint256 i = 0; i < oldStudents.length; i++) {
            if (oldStudents[i] == studentAddress) {
                oldStudents[i] = oldStudents[oldStudents.length - 1];
                oldStudents.pop();
                break;
            }
        }
        
        // Add student to new institute's list
        instituteToStudents[newInstitute].push(studentAddress);
        
        // Update student's institute
        studentToInstitute[studentAddress] = newInstitute;
        
        // Clear the request
        delete instituteChangeRequests[studentAddress];
        
        emit InstituteChangeApproved(studentAddress, oldInstitute, newInstitute);
    }
    
    /**
     * @dev Get institute change request for a student
     * @param studentAddress Address of the student
     * @return newInstitute Address of the new institute (address(0) if no request)
     * @return isPending Whether request is pending
     */
    function getInstituteChangeRequest(address studentAddress) external view returns (
        address newInstitute,
        bool isPending
    ) {
        InstituteChangeRequest memory request = instituteChangeRequests[studentAddress];
        return (request.newInstitute, request.isPending);
    }
}
