import { Link } from 'react-router-dom';
import { ChevronRight, Drone } from 'lucide-react';
import { droneDisplayName } from '../utils/drone';

export default function DroneCard({ drone }) {
  const name = droneDisplayName(drone.nombre);

  return (
    <Link
      to={`/drone/${drone.id}`}
      className="group flex flex-col overflow-hidden rounded-card bg-surface-soft shadow-soft-xs transition-[transform,box-shadow] duration-450 ease-emil hover:-translate-y-1 hover:shadow-soft-lg"
    >
      <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-white">
        {drone.imagen_url ? (
          <img
            src={drone.imagen_url}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-450 ease-emil group-hover:scale-[1.04]"
          />
        ) : (
          <Drone size={56} strokeWidth={1.25} className="text-ink-tertiary" />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 px-6 py-5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-[19px] font-semibold tracking-tight text-ink">{name}</h3>
          {drone.simulable && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700">
              Simulable
            </span>
          )}
          {drone.es_real === false && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
              Simulation only
            </span>
          )}
        </div>
        {drone.modelo && (
          <p className="text-[13px] font-medium text-ink-secondary">{drone.modelo}</p>
        )}
        {drone.descripcion && (
          <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-ink-secondary">
            {drone.descripcion}
          </p>
        )}

        <span className="mt-3 inline-flex items-center gap-0.5 text-[13px] font-medium text-brown-600">
          View details
          <ChevronRight
            size={15}
            strokeWidth={2}
            className="transition-transform duration-350 ease-emil group-hover:translate-x-0.5"
          />
        </span>
      </div>
    </Link>
  );
}
