# Frontend Integration Guide

## 🔌 Connecting React Frontend to Spring Boot Backend

This guide explains how to integrate your React/TypeScript frontend with the ThichDulich backend.

---

## 1. API Configuration

### Create API Service Base URL

Create a new file: `src/app/services/ApiService.ts`

```typescript
const API_BASE_URL = 'http://localhost:8080/api';

export const apiClient = {
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
};

// Add Authorization header with token
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    ...apiClient.headers,
    Authorization: token ? `Bearer ${token}` : '',
  };
};
```

---

## 2. Update Auth Context

Modify `src/app/contexts/AuthContext.tsx`:

```typescript
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin' | 'provider';
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, phone: string, role?: 'user' | 'provider') => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success && data.data.token) {
        const userData: User = {
          id: data.data.id,
          name: data.data.name,
          email: data.data.email,
          phone: data.data.email,
          role: data.data.role.toLowerCase() as 'user' | 'admin' | 'provider',
        };

        setUser(userData);
        setToken(data.data.token);
        localStorage.setItem('currentUser', JSON.stringify(userData));
        localStorage.setItem('token', data.data.token);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    phone: string,
    role: 'user' | 'provider' = 'user'
  ): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone, role }),
      });

      const data = await response.json();

      if (data.success && data.data.token) {
        const userData: User = {
          id: data.data.id,
          name: data.data.name,
          email: data.data.email,
          phone: data.data.email,
          role: data.data.role.toLowerCase() as 'user' | 'admin' | 'provider',
        };

        setUser(userData);
        setToken(data.data.token);
        localStorage.setItem('currentUser', JSON.stringify(userData));
        localStorage.setItem('token', data.data.token);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Register error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

---

## 3. Create API Fetch Utilities

Create `src/app/services/FetchService.ts`:

```typescript
import { getAuthHeaders } from './ApiService';

const API_BASE_URL = 'http://localhost:8080/api';

export const fetchAPI = async <T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = getAuthHeaders();

  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired, redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      window.location.href = '/login';
    }
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
};

// GET request
export const get = <T>(endpoint: string): Promise<T> => {
  return fetchAPI<T>(endpoint, { method: 'GET' });
};

// POST request
export const post = <T>(endpoint: string, data: any): Promise<T> => {
  return fetchAPI<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// PUT request
export const put = <T>(endpoint: string, data: any): Promise<T> => {
  return fetchAPI<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

// DELETE request
export const del = <T>(endpoint: string): Promise<T> => {
  return fetchAPI<T>(endpoint, { method: 'DELETE' });
};
```

---

## 4. Update Services to Call Backend

### Update TourManagementContext

Modify `src/app/contexts/TourManagementContext.tsx`:

```typescript
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { get, post, put, del } from '../services/FetchService';

export interface Tour {
  id: string;
  name: string;
  description: string;
  location: string;
  type: 'adventure' | 'beach' | 'cultural' | 'food' | 'nature' | 'city';
  duration: number;
  price: number;
  image: string;
  rating: number;
  reviews: number;
  availability: boolean;
  status: 'approved' | 'pending' | 'rejected' | 'need_edit' | 'updated';
  providerId: string;
  providerName: string;
}

interface TourContextType {
  tours: Tour[];
  loading: boolean;
  fetchAllTours: () => Promise<void>;
  fetchToursByType: (type: string) => Promise<void>;
  fetchTourById: (id: string) => Promise<Tour>;
  createTour: (tour: Omit<Tour, 'id'>) => Promise<Tour>;
  updateTour: (id: string, tour: Partial<Tour>) => Promise<Tour>;
  deleteTour: (id: string) => Promise<void>;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export function TourManagementProvider({ children }: { children: ReactNode }) {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAllTours = async () => {
    setLoading(true);
    try {
      const response = await get<any>('/tours');
      setTours(response.data || []);
    } catch (error) {
      console.error('Error fetching tours:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchToursByType = async (type: string) => {
    setLoading(true);
    try {
      const response = await get<any>(`/tours/type/${type}`);
      setTours(response.data || []);
    } catch (error) {
      console.error('Error fetching tours by type:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTourById = async (id: string): Promise<Tour> => {
    try {
      const response = await get<any>(`/tours/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching tour:', error);
      throw error;
    }
  };

  const createTour = async (tour: Omit<Tour, 'id'>): Promise<Tour> => {
    try {
      const response = await post<any>('/tours', tour);
      return response.data;
    } catch (error) {
      console.error('Error creating tour:', error);
      throw error;
    }
  };

  const updateTour = async (id: string, tour: Partial<Tour>): Promise<Tour> => {
    try {
      const response = await put<any>(`/tours/${id}`, tour);
      return response.data;
    } catch (error) {
      console.error('Error updating tour:', error);
      throw error;
    }
  };

  const deleteTour = async (id: string): Promise<void> => {
    try {
      await del<any>(`/tours/${id}`);
    } catch (error) {
      console.error('Error deleting tour:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchAllTours();
  }, []);

  return (
    <TourContext.Provider
      value={{
        tours,
        loading,
        fetchAllTours,
        fetchToursByType,
        fetchTourById,
        createTour,
        updateTour,
        deleteTour,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTourManagement() {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error('useTourManagement must be used within TourManagementProvider');
  }
  return context;
}
```

---

## 5. Update Booking Context

Similar pattern for `src/app/contexts/BookingContext.tsx`:

```typescript
"use client";

import { createContext, useContext, useState, ReactNode } from 'react';
import { get, post, put } from '../services/FetchService';
import { useAuth } from './AuthContext';

export interface Booking {
  id: string;
  tourId: string;
  tourName: string;
  userId: string;
  startDate: string;
  endDate?: string;
  adults: number;
  children: number;
  totalAmount: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  createdAt: string;
}

interface BookingContextType {
  bookings: Booking[];
  createBooking: (booking: Omit<Booking, 'id' | 'createdAt'>) => Promise<Booking>;
  getUserBookings: () => Promise<void>;
  cancelBooking: (bookingId: string) => Promise<void>;
  updateBookingStatus: (bookingId: string, status: string) => Promise<void>;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const { user } = useAuth();

  const createBooking = async (booking: Omit<Booking, 'id' | 'createdAt'>): Promise<Booking> => {
    try {
      const response = await post<any>('/bookings', booking);
      return response.data;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  };

  const getUserBookings = async () => {
    if (!user) return;
    try {
      const response = await get<any>('/bookings/my-bookings');
      setBookings(response.data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    try {
      await post<any>(`/bookings/${bookingId}/cancel`, {});
      await getUserBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      await put<any>(`/bookings/${bookingId}/status/${status}`, {});
      await getUserBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
      throw error;
    }
  };

  return (
    <BookingContext.Provider
      value={{
        bookings,
        createBooking,
        getUserBookings,
        cancelBooking,
        updateBookingStatus,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBookings() {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBookings must be used within BookingProvider');
  }
  return context;
}
```

---

## 6. CORS Issue Resolution

If you get CORS errors in browser console:

The backend is already configured with CORS for:
- `http://localhost:3000`
- `http://localhost:5173`

If your frontend runs on a different port, update `src/main/java/com/example/thichdulich/config/SecurityConfig.java`:

```java
configuration.setAllowedOrigins(Arrays.asList(
  "http://localhost:3000", 
  "http://localhost:5173",
  "http://your-frontend-url"  // Add your URL here
));
```

---

## 7. Environment Configuration

Create `.env.local` in your frontend root:

```env
VITE_API_URL=http://localhost:8080/api
REACT_APP_API_URL=http://localhost:8080/api
```

Use in your code:

```typescript
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:8080/api';
```

---

## 8. Token Management

The token is automatically saved in `localStorage` after login. Make sure to:

1. **Send token in requests** - Use `getAuthHeaders()` function
2. **Clear token on logout** - AuthContext handles this
3. **Handle 401 responses** - FetchService redirects to login
4. **Token expiration** - 24 hours (re-login required)

---

## 9. Common Issues & Solutions

### Issue: "CORS error: Access to XMLHttpRequest"

**Solution:** Backend CORS is configured, ensure frontend URL is added to allowed origins list.

### Issue: "401 Unauthorized"

**Solution:** Token not sent or expired. Re-login.

### Issue: "Cannot POST /api/tours"

**Solution:** Check backend is running on `http://localhost:8080`

### Issue: "Network error: Failed to fetch"

**Solution:** 
- Backend not running
- API base URL is incorrect
- Frontend and backend on different networks

---

## 10. Testing Integration

### Test Login

```typescript
const { login } = useAuth();

const handleLogin = async () => {
  const success = await login('user@demo.com', 'demo123');
  if (success) {
    // Show dashboard
  }
};
```

### Test Fetching Tours

```typescript
import { useEffect } from 'react';
import { get } from './services/FetchService';

useEffect(() => {
  const fetchTours = async () => {
    try {
      const response = await get<any>('/tours');
      console.log('Tours:', response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  fetchTours();
}, []);
```

---

## 11. API Response Format

All API responses follow this format:

```json
{
  "success": true,
  "message": "Success message",
  "data": { /* actual data */ },
  "statusCode": 200
}
```

Extract data:
```typescript
const response = await get<any>('/tours');
const tours = response.data; // Access actual data here
```

---

## ✅ Integration Checklist

- [ ] Backend running on `http://localhost:8080`
- [ ] Database populated with sample data
- [ ] Created `FetchService.ts`
- [ ] Updated `AuthContext.tsx` to call backend
- [ ] Updated `TourManagementContext.tsx`
- [ ] Updated `BookingContext.tsx`
- [ ] Updated `ReviewService.ts` (if exists)
- [ ] Tested login/register
- [ ] Tested tour fetching
- [ ] Tested booking creation
- [ ] Token properly stored and sent

---

**Frontend-Backend Integration Complete! 🎉**
