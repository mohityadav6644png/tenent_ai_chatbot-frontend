import { PrivacyNotice } from './PrivacyNotice.jsx';

export function TenantDetailSkeleton() {
  return (
    <div className="tenant-detail-loading" aria-label="Loading tenant details">
      <div className="tenant-detail-skeleton tenant-detail-skeleton--heading" />
      <PrivacyNotice />
      <div className="tenant-detail-stats">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="platform-stat-skeleton" key={index} />
        ))}
      </div>
      <div className="tenant-detail-skeleton tenant-detail-skeleton--table" />
    </div>
  );
}
