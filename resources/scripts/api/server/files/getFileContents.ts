import http from '@/api/http';

export default (server: string, file: string, logActivity: boolean = true): Promise<string> => {
    return new Promise((resolve, reject) => {
        http.get(`/api/client/servers/${server}/files/contents`, {
            params: { file, logActivity },
            transformResponse: (res) => res,
            responseType: 'text',
        })
            .then(({ data }) => resolve(data))
            .catch(reject);
    });
};
