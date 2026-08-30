import { Link2 } from 'lucide-react';
import { fileExtension } from '../utils/resource';

export default function ResourceIcon({ resource }) {
  if (resource.icono_url) {
    return <img src={resource.icono_url} alt="" className="h-8 w-8 shrink-0 rounded-control object-contain" />;
  }

  const ext = fileExtension(resource.url);
  if (ext) {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-brand-100 text-[10px] font-semibold text-brown-600">
        {ext}
      </span>
    );
  }

  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-brand-100 text-brown-600">
      <Link2 size={16} strokeWidth={1.75} />
    </span>
  );
}
