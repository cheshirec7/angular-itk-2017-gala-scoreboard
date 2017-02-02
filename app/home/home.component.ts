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

import { Http } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import { Subscription } from "rxjs";
import { TimerObservable } from "rxjs/observable/TimerObservable";
import 'rxjs/add/operator/catch'
import 'rxjs/add/operator/map';

@Component({
  selector: 'home',
  styleUrls: ['./home.component.css'],
  templateUrl: './home.component.html',
  animations: [
    trigger('slideInOut', [
      state('center', style({
        transform: 'translate3d(0, 0, 0)',
        opacity: '1'
      })),
      state('left', style({
        transform: 'translate3d(-100%, 0, 0)',
        opacity: '1'
      })),
      state('right', style({
        transform: 'translate3d(100%, 0, 0)',
        opacity: '1'
      })),
      state('skip', style({
        opacity: '0'
      })),
      transition('center => left, right => center', animate('800ms ease-in-out')),
    ]),
  ]
})
export class HomeComponent implements OnInit {

  public data: any;
  public slideState = 'center';
  public fsize = 20;

  private numRowsToDisplay = 19;
  private displayTimeSecs = 10;

  private timer: any;
  private timerSubscription: any;
  private fileSubscription: any;
  private paramSubscription: any;
  private numItems = 0;
  private fileData: any;
  private initialDelaySecs = 0;
  private tick = 0;

  constructor(private http: Http,
    private route: ActivatedRoute) {
  }

  restart(delay) {
    this.timerSubscription.unsubscribe();
    this.fileSubscription.unsubscribe();
    this.initialDelaySecs = delay;
    this.numItems = 0;
    this.getFileAndStartTimer();
  }

  populateData() {
    let needRestart = false;
    this.data = [];
    let idx = this.tick * this.numRowsToDisplay;
    //0*23: 0 to 0+23
    //1*23: 23 to 23+23

    for (var i = idx; i < idx + this.numRowsToDisplay; i++) {
      if (i < this.numItems) {
        let o = new Object;
        o['number'] = this.fileData.displayData.itemClients[i].item.number;
        o['name'] = this.fileData.displayData.itemClients[i].item.name;
        o['value'] = this.fileData.displayData.itemClients[i].item.value;
        o['currentBid'] = this.fileData.displayData.itemClients[i].item.currentBid;
        o['client'] = '';
        if (this.fileData.displayData.itemClients[i].client)
          o['client'] = this.fileData.displayData.itemClients[i].client.number + ' ' + this.fileData.displayData.itemClients[i].client.lastName;
        this.data.push(o);
      } else {
        needRestart = true;
        break;
      }
    };

    if (this.data.length == 0) {
      this.slideState = 'skip';
      this.restart(0);
    } else if (needRestart)
      this.restart(this.displayTimeSecs);
  }

  animationDone($event) {
    //console.log($event);
    if ($event.toState == 'left') {
      this.slideState = 'right';
      this.populateData();
    } else if ($event.toState == 'right')
      this.slideState = 'center';
  }

  getFileData() {
    // console.log('getfiledata');
    return this.http.get('assets/data/next.json?hash_id=' + Math.random())
      .map(data => data.json())
      .catch(err => {
        let o = {
          displayData: {
            itemClients: []
          }
        };
        return Observable.of(o);
      });
  }

  getFileAndStartTimer() {
    this.fileSubscription = this.getFileData()
      .subscribe(filedata => {
        if (filedata.displayData.itemClients.length > 0) {
          this.fileData = filedata;
          this.numItems = filedata.displayData.itemClients.length;
          this.timer = TimerObservable.create(this.initialDelaySecs * 1000, this.displayTimeSecs * 1000);
          this.timerSubscription = this.timer.subscribe(t => {
            this.tick = t;
            this.slideState = 'left';
          });
        } else {
          this.timer = TimerObservable.create(2000, 2000);
          this.timerSubscription = this.timer.subscribe(t => {
            this.restart(0);
          });
        }
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

      this.getFileAndStartTimer();
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
