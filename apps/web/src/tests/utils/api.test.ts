import { apiClient, apiFetch } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';

describe('API Client Utility', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, user: null });
    jest.clearAllMocks();
  });

  describe('Request Interceptor', () => {
    it('should not attach Authorization header if token is not available', async () => {
      // Find request interceptor
      const handlers = (apiClient.interceptors.request as any).handlers;
      const interceptor = handlers[0];
      
      const config = { headers: {} } as any;
      const updatedConfig = await interceptor.fulfilled(config);
      
      expect(updatedConfig.headers.Authorization).toBeUndefined();
    });

    it('should attach Bearer token to Authorization header if available', async () => {
      useAuthStore.setState({ token: 'test-jwt-token' });
      
      const handlers = (apiClient.interceptors.request as any).handlers;
      const interceptor = handlers[0];
      
      const config = { headers: {} } as any;
      const updatedConfig = await interceptor.fulfilled(config);
      
      expect(updatedConfig.headers.Authorization).toBe('Bearer test-jwt-token');
    });
  });

  describe('Response Interceptor', () => {
    it('should resolve response if request succeeded', async () => {
      const handlers = (apiClient.interceptors.response as any).handlers;
      const interceptor = handlers[0];
      
      const response = { data: 'some-data' } as any;
      const resolved = await interceptor.fulfilled(response);
      
      expect(resolved).toEqual(response);
    });

    it('should format error message using backend data.error', async () => {
      const handlers = (apiClient.interceptors.response as any).handlers;
      const interceptor = handlers[0];
      
      const error = {
        response: {
          status: 400,
          data: { error: 'Validation failed on inputs' }
        }
      } as any;
      
      await expect(interceptor.rejected(error)).rejects.toThrow('Validation failed on inputs');
    });

    it('should format error message using backend data.message', async () => {
      const handlers = (apiClient.interceptors.response as any).handlers;
      const interceptor = handlers[0];
      
      const error = {
        response: {
          status: 500,
          data: { message: 'Internal server exception' }
        }
      } as any;
      
      await expect(interceptor.rejected(error)).rejects.toThrow('Internal server exception');
    });

    it('should trigger automatic logout on 401 response status', async () => {
      useAuthStore.setState({ token: 'active-token' });
      const logoutSpy = jest.spyOn(useAuthStore.getState(), 'logout');

      const handlers = (apiClient.interceptors.response as any).handlers;
      const interceptor = handlers[0];
      
      const error = {
        response: {
          status: 401,
          data: { error: 'Session expired' }
        }
      } as any;
      
      await expect(interceptor.rejected(error)).rejects.toThrow('Session expired');
      expect(logoutSpy).toHaveBeenCalled();
      expect(useAuthStore.getState().token).toBeNull();
    });
  });

  describe('apiFetch Wrapper', () => {
    it('should call apiClient.request and map request methods and endpoints', async () => {
      const requestSpy = jest.spyOn(apiClient, 'request').mockResolvedValue({
        data: { list: [1, 2, 3] },
      } as any);

      const result = await apiFetch('/test-endpoint', {
        method: 'POST',
        body: JSON.stringify({ key: 'value' }),
        headers: { 'X-Custom-Header': 'val' },
      });

      expect(requestSpy).toHaveBeenCalledWith({
        url: '/test-endpoint',
        method: 'post',
        data: { key: 'value' },
        headers: { 'X-Custom-Header': 'val' },
      });
      expect(result).toEqual({ list: [1, 2, 3] });
      
      requestSpy.mockRestore();
    });

    it('should parse body if it is stringified JSON', async () => {
      const requestSpy = jest.spyOn(apiClient, 'request').mockResolvedValue({
        data: 'success',
      } as any);

      await apiFetch('/endpoint', {
        method: 'POST',
        body: '{"name":"mock"}',
      });

      expect(requestSpy).toHaveBeenCalledWith({
        url: '/endpoint',
        method: 'post',
        data: { name: 'mock' },
        headers: undefined,
      });
      
      requestSpy.mockRestore();
    });
  });
});
