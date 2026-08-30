// Drone names in Supabase are stored as "<name> - <team>" (e.g. "F450 - Escudería CEM").
// The dashboard only shows the drone's own name, never the trailing team suffix.
export function droneDisplayName(nombre) {
  if (!nombre) return nombre;
  return nombre.split(' - ')[0].trim();
}
