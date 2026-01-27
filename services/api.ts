import { getApiUrl, getApiBase } from '../config/index.js';

interface UserContext {
  userId?: string;
  userRole?: string;
}

export const api = {
  get: async <T>(entity: 'players' | 'teams', sport?: string, userContext?: UserContext): Promise<T[]> => {
    try {
      let url = getApiUrl(entity, sport);
      
      // Add user context as query parameters if provided
      if (userContext?.userId && userContext?.userRole) {
        const separator = url.includes('?') ? '&' : '?';
        url += `${separator}userId=${encodeURIComponent(userContext.userId)}&userRole=${encodeURIComponent(userContext.userRole)}`;
      }
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Fetch failed');
      return res.json();
    } catch (err) {
      console.error(`API Get Error (${entity}):`, err);
      return [];
    }
  },

  create: async <T>(entity: 'players' | 'teams', data: Partial<T>, sport?: string): Promise<T | null> => {
    try {
      const url = getApiUrl(entity, sport);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Create failed');
      return res.json();
    } catch (err) {
      console.error(`API Post Error (${entity}):`, err);
      return null;
    }
  },

  update: async <T>(entity: 'players' | 'teams', id: string, data: Partial<T>, sport?: string): Promise<boolean> => {
    try {
      const baseUrl = getApiBase();
      const entityPath = entity === 'teams' ? 'teams' : entity;
      const url = sport ? `${baseUrl}/${entityPath}/${sport}/${id}` : `${baseUrl}/${entityPath}/${id}`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.ok;
    } catch (err) {
      console.error(`API Put Error (${entity}):`, err);
      return false;
    }
  },

  delete: async (entity: 'players' | 'teams', id: string, sport?: string, userContext?: UserContext): Promise<boolean> => {
    try {
      const baseUrl = getApiBase();
      const entityPath = entity === 'teams' ? 'teams' : entity;
      let url = sport ? `${baseUrl}/${entityPath}/${sport}/${id}` : `${baseUrl}/${entityPath}/${id}`;
      
      // Add user context as query parameters if provided
      if (userContext?.userId && userContext?.userRole) {
        const separator = url.includes('?') ? '&' : '?';
        url += `${separator}userId=${encodeURIComponent(userContext.userId)}&userRole=${encodeURIComponent(userContext.userRole)}`;
      }
      
      const res = await fetch(url, {
        method: 'DELETE',
      });
      return res.ok;
    } catch (err) {
      console.error(`API Delete Error (${entity}):`, err);
      return false;
    }
  }
};