
import {
    HttpInterceptorFn,
    HttpClient,
    HttpErrorResponse
} from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';
import {
    catchError,
    switchMap,
    throwError
} from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

    const authService = inject(AuthService);
    const http = inject(HttpClient);

    const token = authService.getToken();
    const authReq = token
        ? req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        })
        : req;

    return next(authReq).pipe(

        catchError((error: HttpErrorResponse) => {

            if (
                error.status === 401 &&
                !req.url.includes('/auth/refresh') &&
                token
            ) {

                return http.post<{ message: string; accessToken: string }>(
                    'http://localhost:3000/api/auth/refresh',
                    {},
                    { withCredentials: true }
                ).pipe(

                    switchMap(response => {

                        authService.setToken(response.accessToken);

                        const retryReq = req.clone({
                            setHeaders: {
                                Authorization: `Bearer ${response.accessToken}`
                            }
                        });

                        return next(retryReq);
                    }),

                    catchError(refreshError => {

                        authService.logout();

                        return throwError(() => refreshError);
                    })
                );
            }

            return throwError(() => error);
        })
    );
};
