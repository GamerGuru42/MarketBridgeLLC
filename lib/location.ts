export interface Coordinates {
    lat: number;
    lng: number;
}

export interface UniversityNode {
    id: string;
    name: string;
    coords: Coordinates;
}

export const ABUJA_UNIVERSITIES: UniversityNode[] = [
    {
        id: 'cosmopolitan',
        name: 'Cosmopolitan University',
        coords: { lat: 9.0435, lng: 7.4912 } // Wuse/Central approximation
    },
    {
        id: 'nile',
        name: 'Nile University',
        coords: { lat: 9.0112, lng: 7.4042 }
    },
    {
        id: 'veritas',
        name: 'Veritas University',
        coords: { lat: 9.2662, lng: 7.4208 }
    },
    {
        id: 'uniabuja',
        name: 'University of Abuja',
        coords: { lat: 8.9744, lng: 7.0722 }
    },
    {
        id: 'baze',
        name: 'Baze University',
        coords: { lat: 9.0631, lng: 7.4561 }
    }
];

export function getDistance(p1: Coordinates, p2: Coordinates): number {
    const R = 6371; // km
    const dLat = (p2.lat - p1.lat) * Math.PI / 180;
    const dLng = (p2.lng - p1.lng) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export function findNearestUniversity(coords: Coordinates): { node: UniversityNode; distance: number } | null {
    let nearest: UniversityNode | null = null;
    let minDistance = Infinity;

    for (const node of ABUJA_UNIVERSITIES) {
        const d = getDistance(coords, node.coords);
        if (d < minDistance) {
            minDistance = d;
            nearest = node;
        }
    }

    return nearest ? { node: nearest, distance: minDistance } : null;
}
