const StudentListSkeleton = () => (
  <div className="animate-pulse space-y-4">
    {[...Array(2)].map((_, i) => (
      <div key={i} className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
            <div>
              <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-48"></div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-9 bg-gray-200 rounded w-20"></div>
            <div className="h-9 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default StudentListSkeleton;
