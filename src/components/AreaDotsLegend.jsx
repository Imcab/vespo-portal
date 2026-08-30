export default function AreaDotsLegend({ areas, activeAreaIds }) {
  if (areas.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 rounded-control bg-surface-soft px-2.5 py-2">
      {areas.map((area) => {
        const active = activeAreaIds.includes(area.id);
        return (
          <span
            key={area.id}
            title={area.nombre}
            className={`h-2.5 w-2.5 shrink-0 rounded-full transition-colors duration-350 ease-emil ${
              active ? '' : 'ring-1 ring-inset ring-line'
            }`}
            style={{ backgroundColor: active ? area.color || '#6c450e' : 'transparent' }}
          />
        );
      })}
    </div>
  );
}
