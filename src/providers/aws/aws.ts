import { Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';


@Injectable()
export class AwsProvider {

    apiUrl = ''

    constructor(private http: HttpClient) { }

    getSignedUploadRequest(name, type) {
        return this.http.get(`${this.apiUrl}aws/sign?file-name=${name}&file-type=${type}`).pipe(map((res: Response) => res.json()));
    }

    getFileList(): Observable<Array<any>> {

        return this.http.get(`${this.apiUrl}aws/files`)
            .pipe(map((res: Response) => res.json()))
            .pipe(map(res => {
                return res['Contents'].map(val => val.Key);
            }));

    }

    getSignedFileRequest(name) {
        return this.http.get(`${this.apiUrl}aws/files/${name}`).pipe(map((res: Response) => res.json()));
    }

    deleteFile(name) {
        return this.http.delete(`${this.apiUrl}aws/files/${name}`).pipe(map((res: Response) => res.json()));
    }

    // https://www.thepolyglotdeveloper.com/2015/03/create-a-random-nonce-string-using-javascript/
    randomString = function (length) {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    uploadFile(url, file) {
        return this.http.put(url, file);
    }

}