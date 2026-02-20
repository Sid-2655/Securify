import PropTypes from 'prop-types';
import StudentListItem from './StudentListItem';
import StudentListSkeleton from './StudentListSkeleton';

const StudentList = ({ students, onVerifyClick, isLoading, studentCertificates }) => (
  <div className="flex-1 p-8">
    <h1 className="text-3xl font-bold text-purple-600 mb-6">Linked Students</h1>
    <div className="space-y-4">
      {isLoading ? (
        <StudentListSkeleton />
      ) : students.length === 0 ? (
        <p className="text-gray-500">No students linked yet.</p>
      ) : (
        students.map((student) => (
          <StudentListItem
            key={student.address}
            student={student}
            certificates={studentCertificates[student.address] || []}
            onVerifyClick={onVerifyClick}
          />
        ))
      )}
    </div>
  </div>
);

StudentList.propTypes = {
  students: PropTypes.array.isRequired,
  onVerifyClick: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
  studentCertificates: PropTypes.object.isRequired,
};

export default StudentList;
