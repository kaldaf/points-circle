import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import circleToPolygon from 'circle-to-polygon';
import { IPointModel } from 'src/models/IPoint.model';
import { IPolyOptionModel } from 'src/models/IPolyOption.model';
import { ApiConnectionService } from 'src/services/api-connection.service';

declare var SMap: any;
declare var JAK: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  @ViewChild('map', { static: false }) mainMap: ElementRef;
  @ViewChild('searchInputMaps', { static: true }) placeInput: ElementRef;

  points: IPointModel[] = [];
  filteredResults: IPointModel[] = [];
  polyPoints: IPolyOptionModel[] = [];

  sliderKilometers: number = 3;

  locationCoords = { lat: 0, lon: 0 };
  mapDOM: any;
  radiusLayer: any;

  constructor(
    private _API: ApiConnectionService,
  ) {}

  ngOnInit() {
    this.getData().then(() => {
      this.getUserLocation();
      // Default coords, kde se zoomne a default scale mapy
      this.setupMap(
        { coords: { latitude: 49.205939, longitude: 16.5995405 } },8);
      this.sliderChange({ value: this.sliderKilometers });
    });
  }

  async getData() {
    this.points = this._API.getData();
  }

  getUserLocation() {
    if (!navigator.geolocation) {
      alert('Prohlížeč nepodporuje geolokaci.');
    } else {
      navigator.geolocation.getCurrentPosition((e) => {
          this.setupMap(e, 15);
          this.sliderChange({ value: this.sliderKilometers });
      },
        null,
        {
          timeout: 10000,
        }
      );
    }
  }

  setupMap(position: any, scale: number) {
    // Při každém zavolání mapy smažeme všechny elementy, aby se nám nepřekreslovaly
    this.mainMap.nativeElement.innerHTML = '';

    const coords = position.coords;
    this.locationCoords.lat = coords.latitude;
    this.locationCoords.lon = coords.longitude;

    let center = SMap.Coords.fromWGS84(coords.longitude, coords.latitude);
    this.mapDOM = new SMap(this.mainMap.nativeElement, center, scale);
    this.mapDOM.addDefaultLayer(SMap.DEF_BASE).enable();

    // Nastavení controls, kterýma bude moci uživatel používat mapu
    this.mapDOM.addControl(
      new SMap.Control.Mouse(SMap.MOUSE_PAN | SMap.MOUSE_ZOOM | SMap.MOUSE_WHEEL, {
        minDriftSpeed: 1 / 0,
      })
    );
    this.mapDOM.addControl(
      new SMap.Control.Keyboard(SMap.KB_PAN | SMap.KB_ZOOM, {
        focusedOnly: false,
      })
    );
    this.mapDOM.addControl(
      new SMap.Control.Zoom(
        {},
        {
          titles: ['Přiblížit', 'Oddálit'],
          showZoomMenu: false,
        }
      ),
      {
        right: '-1.5rem',
        bottom: '7rem',
      }
    );
    // Zavoláme našeptávač
    this.setSuggest();
  }

  sliderChange(event: any) {
    if (this.radiusLayer != null || this.radiusLayer != undefined) {
      this.radiusLayer.clear();
      this.radiusLayer.removeAll();
      this.radiusLayer.redraw();
    }
    this.sliderKilometers = event.value;
    this.drawMapRadius(event.value);
  }

  drawMapRadius(radius: number) {
    // Vynulování všech vyfiltrovaných hodnot a předešlého radiusu
    this.polyPoints = [];
    this.filteredResults = [];
    // Vytvoření vrstvy, do které budeme vkládat "kruh"
    this.radiusLayer = new SMap.Layer.Geometry();

    // Nastavení barev apod.
    const options = {
      color: '#3a6a3a',
      opacity: 0.1,
      outlineColor: '#3a6a3a',
      outlineOpacity: 0.5,
      outlineWidth: 3,
    };

    // Přidání vrstvy a její následné povolední
    this.mapDOM.addLayer(this.radiusLayer);
    this.radiusLayer.enable();

    // r = radius z matslideru, nejak random to pomoci "vzorce" funguje
    const r = radius * 1000;

    // Stanovení oblasti, kde se bude vyhledávat
    const center = SMap.Coords.fromWGS84(
      this.locationCoords.lon,
      this.locationCoords.lat
    );

    // Získání poloměru z kruhu, díky - https://napoveda.seznam.cz/forum/threads/113565/1
    const point = SMap.Coords.fromWGS84(
    this.locationCoords.lon,
    this.locationCoords.lat - ((Math.sign(this.locationCoords.lat) * r) / 10e6) * 90);


    // Přidání vrstvy
    const circle = new SMap.Geometry(
      SMap.GEOMETRY_CIRCLE,
      null,
      [center, point],
      options
    );

    this.radiusLayer.addGeometry(circle);

    // SET MAP ZOOM - VZOREC JESTE POFIXOVAT
    const zoomCalc = 13 - radius / 19;
    this.mapDOM.setCenterZoom(center, parseInt(zoomCalc.toFixed(0)), true);

    // Protože api.mapy.cz fungují přes polygony, musíme si kruh převést do polygonu
    // který bude mít 32 hran
    const polygonCoords = circleToPolygon(
      [circle._coords[0].x, circle._coords[0].y],
      r,
      32
    ).coordinates;
    polygonCoords[0].forEach((e, i) => {
      this.polyPoints.push({ x: e[0], y: e[1] });
    });

    // Vložíme marker, do kterého budeme přidávat vygenerované body z mapy
    const markerLayer = new SMap.Layer.Marker();

    this.points.forEach((e, i) => {
      const editedPoints = SMap.Coords.fromWGS84(e.lon, e.lat);
      if (
        SMap.Util.pointInPolygon(
          [editedPoints.x, editedPoints.y],
          this.polyPoints.map(Object.values)
        )
      ) {
        this.filteredResults.push(e);
      }

      let c = SMap.Coords.fromWGS84(e.lon, e.lat);

      const marker = JAK.mel(
        'p',
        {
          title: e.title,
        },
        {
          width: '0.75rem',
          height: '0.75rem',
          background: '#3a6a3a',
          borderRadius: '50%',
          border: '1px solid #fff',
          cursor: 'pointer',
          marginTop: '1.5rem',
        }
      );
      const pointMarker = new SMap.Marker(c, i, {
        url: marker,
      });
      markerLayer.addMarker(pointMarker);
    });
    this.mapDOM.addLayer(markerLayer);
    markerLayer.enable();
  }

  setSuggest() {
    let suggest = new SMap.Suggest(this.placeInput.nativeElement, {
      provider: new SMap.SuggestProvider({
        updateParams: (params: any) => {
          params.lang = 'cs';
        },
      }),
    });
    suggest.addListener('suggest', (res: any) => {
      setTimeout(() => {
        this.setupMap(
          {
            coords: {
              latitude: res.data.latitude,
              longitude: res.data.longitude,
            },
          },
          13
        );
        this.sliderChange({ value: this.sliderKilometers });
      }, 500);
    });
  }
  formatLabel(value: number) {
    return value + 'km';
  }
}
