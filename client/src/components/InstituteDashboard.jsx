import { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';

const InstituteDashboard = () => {
  const { contract, account, sendTransaction, callContract } = useWeb3();
  const [profile, setProfile] = useState(null);
  const [linkedStudents, setLinkedStudents] = useState([]);
  const [pendingUploads, setPendingUploads] = useState([]);
  const [studentCertificates, setStudentCertificates] = useState({});

  useEffect(() => {
    loadData();
  }, [contract, account]);

  const loadData = async () => {
    if (!contract || !account) return;

    try {
      // Load profile
      const profileData = await contract.getProfile(account);
      setProfile({
        name: profileData[0],
        profilePicture: profileData[1],
        exists: profileData[2],
        isInstitute: profileData[3],
      });

      // Load linked students
      const students = await contract.getInstituteStudents(account);
      const studentsWithProfiles = await Promise.all(
        students.map(async (studentAddress) => {
          const studentProfile = await contract.getProfile(studentAddress);
          return {
            address: studentAddress,
            name: studentProfile[0],
            profilePicture: studentProfile[1],
          };
        })
      );
      setLinkedStudents(studentsWithProfiles);

      // Load pending uploads
      const [pendingStudents, pendingIndices] = await contract.getPendingUploads(account);
      setPendingUploads(
        pendingStudents.map((student, index) => ({
          student,
          certificateIndex: Number(pendingIndices[index]),
        }))
      );

      // Load certificates for each student
      const certsMap = {};
      for (const student of students) {
        const certs = await contract.getStudentCertificates(student);
        certsMap[student] = certs.map((cert, index) => ({
          index,
          ipfsHash: cert[0],
          documentName: cert[1],
          uploader: cert[2],
          isVerified: cert[3],
          uploadTimestamp: Number(cert[4]),
        }));
      }
      setStudentCertificates(certsMap);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleVerify = async (studentAddress, certificateIndex) => {
    try {
      const tx = await contract.verifyCertificate(studentAddress, certificateIndex, {
        gasLimit: 500000
      });
      await tx.wait();
      alert('Certificate verified successfully!');
      loadData();
    } catch (error) {
      console.error('Verification error:', error);
      console.error('Error data:', error.data);
      console.error('Error reason:', error.reason);
      console.error('Full error:', error);
      alert('Verification failed: ' + (error.reason || error.message || 'Unknown error'));
    }
  };

  const truncateAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg p-6">
        <h2 className="text-2xl font-bold text-purple-600 mb-6">Institute Profile</h2>
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 bg-purple-200 rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl text-purple-600">
              {profile?.name?.[0]?.toUpperCase() || 'I'}
            </span>
          </div>
          <p className="font-semibold text-lg">{profile?.name || 'Loading...'}</p>
          <p className="text-sm text-gray-600 mt-2">My Address: {truncateAddress(account)}</p>
        </div>
        <button className="w-full px-4 py-2 border-2 border-pink-500 text-pink-500 rounded-lg hover:bg-pink-50 transition-colors">
          VIEW PROFILE
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-purple-600 mb-6">Linked Accounts</h1>

        {/* Students List */}
        <div className="space-y-4">
          {linkedStudents.length === 0 ? (
            <p className="text-gray-500">No students linked yet.</p>
          ) : (
            linkedStudents.map((student) => {
              const certs = studentCertificates[student.address] || [];
              const unverifiedCerts = certs.filter((c) => !c.isVerified);

              return (
                <div key={student.address} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl text-green-600">
                          {student.name?.[0]?.toUpperCase() || 'S'}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{student.name}</p>
                        <p className="text-sm text-gray-500">
                          ADDRESS: {truncateAddress(student.address).toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        VIEW
                      </button>
                      <button className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        CHANGE INSTITUTE
                      </button>
                    </div>
                  </div>

                  {/* Unverified Certificates */}
                  {unverifiedCerts.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm font-semibold text-gray-700 mb-2">
                        Pending Verification:
                      </p>
                      {unverifiedCerts.map((cert) => (
                        <div
                          key={cert.index}
                          className="flex items-center justify-between bg-yellow-50 p-3 rounded-lg mb-2"
                        >
                          <div>
                            <p className="font-medium">{cert.documentName}</p>
                            <p className="text-xs text-gray-500">
                              Uploaded: {new Date(cert.uploadTimestamp * 1000).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleVerify(student.address, cert.index)}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                          >
                            Verify
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default InstituteDashboard;

