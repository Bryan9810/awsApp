import { Component } from '@angular/core';
import { ActionSheetController, LoadingController, ToastController } from '@ionic/angular';
import { AwsProvider } from '../../providers/aws/aws';
import { Camera, CameraOptions } from '@ionic-native/camera/ngx';
import { File } from '@ionic-native/file/ngx';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  images = [];

  constructor(
    private loadingCtrl: LoadingController,
    private awsProvider: AwsProvider,
    private toastCtrl: ToastController,
    private actionSheetCtrl: ActionSheetController,
    private file: File,
    private camera: Camera
  ) { }

  ionViewWillEnter() {
    this.loadImages();
  }

  loadImages() {
    this.images = [];
    this.awsProvider.getFileList().subscribe(files => {
      for (let name of files) {
        this.awsProvider.getSignedFileRequest(name).subscribe(res => {
          this.images.push({ key: name, url: res })
        });
      }
    });
  }

  async presentActionSheet() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Select Image Source',
      buttons: [
        {
          text: 'Load from Library',
          handler: () => {
            this.takePicture(this.camera.PictureSourceType.PHOTOLIBRARY);
          }
        },
        {
          text: 'Use Camera',
          handler: () => {
            this.takePicture(this.camera.PictureSourceType.CAMERA);
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  takePicture(sourceType) {
    // Create options for the Camera Dialog
    const options: CameraOptions = {
      quality: 100,
      correctOrientation: true,
      destinationType: this.camera.DestinationType.FILE_URI,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE,
      sourceType: sourceType
    }

    // Get the picture
    this.camera.getPicture(options).then(async (imageData) => {

      let loading = await this.loadingCtrl.create();
      loading.present();

      // Resolve the picture URI to a file
      this.file.resolveLocalFilesystemUrl(imageData).then(oneFile => {

        // Convert the File to an ArrayBuffer for upload
        this.file.readAsArrayBuffer(this.file.tempDirectory, oneFile.name).then(realFile => {
          let type = 'jpg';
          let newName = this.awsProvider.randomString(6) + new Date().getTime() + '.' + type;

          // Get the URL for our PUT request
          this.awsProvider.getSignedUploadRequest(newName, 'image/jpeg').subscribe(data => {
            let reqUrl = data;

            // Finally upload the file (arrayBuffer) to AWS
            this.awsProvider.uploadFile(reqUrl, realFile).subscribe(result => {

              // Add the resolved URL of the file to our local array
              this.awsProvider.getSignedFileRequest(newName).subscribe(res => {
                this.images.push({ key: newName, url: res });
                loading.dismiss();
              });
            });
          });
        });
      }, err => {
        console.log('err: ', err);
      })
    }, (err) => {
      console.log('err: ', err);
    });
  }

   deleteImage(index) {
    let toRemove = this.images.splice(index, 1);
    this.awsProvider.deleteFile(toRemove[0]['key']).subscribe(async res => {
      let toast = await this.toastCtrl.create({
        message: res['msg'],
        duration: 2000
      });
      toast.present();
    })
  }

}