import { Injectable } from '@angular/core';
import { IPointModel } from 'src/models/IPoint.model';

@Injectable({
  providedIn: 'root'
})
export class ApiConnectionService {

  data: IPointModel[] = [
    {title: "Hrad Špilberk",lat: 49.1944522, lon: 16.5995939},
    {title: "Brno hlavní nádraží",lat:49.1905822, lon:16.6128025},
    {title: "NEWTON University",lat: 49.1957206, lon:  16.6081964},
    {title: "Lidl",lat:49.1941453, lon: 16.6082592},
    {title: "Masarykova Univerzita",lat: 49.1988258, lon: 16.6052264},
    {title: "Vila Tugendhat - Památka UNESCO",lat: 49.2071503, lon: 16.6160397},
    {title: "Ústavní soud",lat: 49.1977642, lon: 16.6044039},
    {title: "Radegast Sportbar",lat: 49.1954728, lon: 16.6073342},
    {title: "Fakultní nemocnice u sv. Anny v Brně",lat: 49.1912400, lon: 16.5990900},
    {title: "BVV - Veletrhy Brno",lat: 49.1876667, lon: 16.5790769},
    {title: "Seznam.cz, a.s. - Brno",lat: 49.1718178, lon: 16.5990161},
  ]

  constructor() { }

  getData() {
    // Tady si připojte svojí API
    return this.data;
  }
}
