const DocumentListSkeleton = () => (
  <div className="animate-pulse">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="border-b border-gray-200 py-4 last:border-b-0 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gray-200"></div>
          <div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
      </div>
    ))}
  </div>
);

export default DocumentListSkeleton;
