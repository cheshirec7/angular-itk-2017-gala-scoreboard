import {
  Component,
  OnInit,
  trigger,
  state,
  style,
  transition,
  animate
} from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import { TimerObservable } from "rxjs/observable/TimerObservable";

@Component({
  selector: 'home',
  styleUrls: ['./home.component.css'],
  templateUrl: './home.component.html',
  animations: [
    trigger('slideInOut', [
      state('center', style({
        transform: 'translate3d(0, 0, 0)'
      })),
      state('left', style({
        transform: 'translate3d(-100%, 0, 0)'
      })),
      state('right', style({
        transform: 'translate3d(100%, 0, 0)'
      })),
      transition('center => left, right => center', animate('800ms ease-in-out')),
    ]),
  ]
})
export class HomeComponent implements OnInit {

  public fileData = [];
  public slideState = 'center';
  public startIdx = 0;
  public endIdx = 0;
  public fsize = 30;

  private jsessionid = 'B85D107A8C32A8AB7ED0294612BCA956';
  private url = 'assets/data/next.json?hash_id=';
  //private url1 = 'http://bputil11.bidpal.net/Scoreboard/slides/1/next.json?hash_id=' + Math.random(); ';//?jsessionid=' + jsessionid;

  private numRowsToDisplay = 13;
  private displayTimeSecs = 9;

  private timer: any;
  private timerSubscription: any;
  private fileSubscription: any;
  private paramSubscription: any;
  private tick = 0;

  constructor(private http: Http,
    private route: ActivatedRoute) {
  }

  animationDone($event) {
    //console.log($event);
    if ($event.toState == 'left') {
      this.slideState = 'right';
      this.startIdx = this.tick * this.numRowsToDisplay; //0, 10, 20, 30...
      this.endIdx = this.startIdx + this.numRowsToDisplay; //0+10=10, 10+10=20
      //template will show 0 to (10-1), 10 to (20-1)...
      //example, 100 items, showing by groups of 10: when startIdx=90, endIdx=100, need to restart after delay
      if (this.endIdx >= this.fileData.length)
        this.getFileDataAndStartTimer(this.displayTimeSecs);
    } else if ($event.toState == 'right')
      this.slideState = 'center';
  }

  getFileData(): any {

    // let headers = new Headers();
    // headers.append('Cookie', 'JSESSIONID=B85D107A8C32A8AB7ED0294612BCA956');
    // let options = new RequestOptions({
    //   url: this.url,
    //   method: 'GET',
    //   withCredentials: true,
    //   headers: headers
    // });
    //return this.http.get(this.url, options)

    return this.http.get(this.url + Math.random())
      .map(this.extractData)
      .catch(this.handleError);
  }

  private extractData(res: Response) {
    let body = res.json();
    if (body.hasOwnProperty('displayData')) {
      let data = body.displayData;
      if (data.hasOwnProperty('itemClients'))
        return data.itemClients;
    }
    console.error('invalid file format');
    return [];
  }

  private handleError(error: Response | any) {
    // let errMsg: string;
    // // console.log('error');
    // if (error instanceof Response) {
    //   const body = error.json() || '';
    //   const err = body.error || JSON.stringify(body);
    //   errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
    // } else {
    //   errMsg = error.message ? error.message : error.toString();
    // }
    // console.error(errMsg);
    return Observable.throw('error');
  }

  startTimer(delay, displayTime, doRestart) {
    this.timer = TimerObservable.create(delay * 1000, displayTime * 1000);
    if (this.timerSubscription)
      this.timerSubscription.unsubscribe();
    this.timerSubscription = this.timer.subscribe(t => {
      if (doRestart) {
        this.getFileDataAndStartTimer(delay);
      } else {
        this.tick = t;
        this.slideState = 'left';
      }
    });
  }

  getFileDataAndStartTimer(delay) {
    if (this.fileSubscription)
      this.fileSubscription.unsubscribe();
    this.fileSubscription = this.getFileData().subscribe(
      filedata => {
        if (filedata) {
          this.fileData = filedata;
          this.startTimer(delay, this.displayTimeSecs, false);
        } else {
          this.startTimer(2, 2, true);
        }
      },
      error => {
        this.startTimer(2, 2, true);
      });
  }

  ngOnInit() {
    this.paramSubscription = this.route.queryParams.subscribe(params => {

      let rows = +params['rows'];
      if (rows > 0)
        this.numRowsToDisplay = rows;

      let time = +params['time'];
      if (time > 0)
        this.displayTimeSecs = time;

      let size = +params['fsize'];
      if (size > 0)
        this.fsize = size;

      this.getFileDataAndStartTimer(0);
    });
  }

  ngOnDestroy() {
    if (this.timerSubscription)
      this.timerSubscription.unsubscribe();

    if (this.fileSubscription)
      this.fileSubscription.unsubscribe();

    if (this.paramSubscription)
      this.paramSubscription.unsubscribe();
  }
}
