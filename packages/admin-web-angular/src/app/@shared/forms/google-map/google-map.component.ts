import { ViewChild, Component, Input, OnInit, OnDestroy, ElementRef, Output, EventEmitter } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
	selector: 'google-map',
	styleUrls: ['./google-map.component.scss'],
	templateUrl: 'google-map.component.html',
})
export class GoogleMapComponent implements OnInit, OnDestroy {
	@ViewChild('gmap', { static: true })
	mapElement: any;

	@ViewChild('centerCoordinates', { static: true })
	centerCoordinatesElement: ElementRef;

	@ViewChild('imgCenterImgPin', { static: true })
	imgCenterImgPin: ElementRef;


	@Input()
	public mapCenterImagePinEnhance: boolean = false;

	@Input()
	public mapMarkerDraggable: boolean = false;

	@Input()
	mapTypeEvent: Observable<string>;

	@Input()
	mapCoordEvent: Observable<google.maps.LatLng | google.maps.LatLngLiteral>;

	@Input()
	mapGeometryEvent: Observable<
		google.maps.places.PlaceGeometry | google.maps.GeocoderGeometry
	>;

	@Output()
	mapCenterCoordinatesEmitter = new EventEmitter<
		google.maps.LatLng | google.maps.LatLngLiteral
	>();

	@Output()
	mapMarkerCoordinatesEmitter = new EventEmitter<
		google.maps.LatLng | google.maps.LatLngLiteral
	>();

	map: google.maps.Map;

	private _mapMarker: google.maps.Marker;

	private _ngDestroy$ = new Subject<void>();

	ngOnInit() {
		this._setupGoogleMap();
		this._listenForMapType();
		this._listenForMapCoordinates();
		this._listenForMapGeometry();
	}


	private _navigateTo(
		location: google.maps.LatLng | google.maps.LatLngLiteral
	) {
		this.map.setCenter(location);
	}

	private _listenForMapGeometry() {
		this.mapGeometryEvent
			.pipe(takeUntil(this._ngDestroy$))
			.subscribe((geometry) => {
				console.log('geometry.location:'+JSON.stringify(geometry.location));
				console.log('geometry.viewport:'+JSON.stringify(geometry.viewport));
				if (geometry.viewport) {
					this.map.fitBounds(geometry.viewport);
				} else {
					this.map.setCenter(geometry.location);
					this.map.setZoom(17);
				}
			});
	}

	private _listenForMapType() {
		if (this.mapTypeEvent) {
			this.mapTypeEvent
				.pipe(takeUntil(this._ngDestroy$))
				.subscribe((mapType: string) => {
					this.map.setMapTypeId(mapType);
				});
		}
	}

	private _listenForMapCoordinates() {
		this.mapCoordEvent
			.pipe(takeUntil(this._ngDestroy$))
			.subscribe((location) => {
				this._navigateTo(location);
				this._addMapMarker(location);
			});
	}

	private _setupGoogleMap() {
		const optionsMap = {
			center: new google.maps.LatLng(0, 0),
			zoom: 14,
			mapTypeId: google.maps.MapTypeId.ROADMAP,
		};

		this.map = new google.maps.Map(
			this.mapElement.nativeElement,
			optionsMap
		);

		let _map = this.map;

		if (this.mapCenterImagePinEnhance){
			google.maps.event.addListener(_map, 'idle', () => {
				var center = _map.getCenter();
				var latLng = new google.maps.LatLng(center.lat(), center.lng());
				this.centerCoordinatesElement.nativeElement.innerHTML = '<p>Center Coordinates: Current Lat: ' +latLng.lat() + ' Current Lng: ' + latLng.lng() + '</p>';
				this._emitCenterMapCoordinates(latLng);
				//document.getElementById('lat').value = wrapped.lat();
				//document.getElementById('lng').value = wrapped.lng();
				//document.getElementById('current').innerHTML ="teste3";

				//document.getElementById('centerCoordinates').innerHTML = '<p>Center Coordinates: Current Lat: ' +
				//_map.getCenter().lat() + ' Current Lng: ' + _map.getCenter().lng() + '</p>';

				//document.getElementById('lat').value = map.getCenter().lat();
				//document.getElementById('lng').value = map.getCenter().lng();
			});
			this._updateCustomPropertyImgPin();
		}

	}

	_updateCustomPropertyImgPin() {
		if (this.mapCenterImagePinEnhance){
			this.imgCenterImgPin.nativeElement.style.setProperty('display', 'inline-block' );
		}
	}

	private _addMapMarker(
		location: google.maps.LatLng | google.maps.LatLngLiteral
	) {
		this._clearMarker();

		this._mapMarker = new google.maps.Marker({
			map: this.map,
			position: location,
			draggable: this.mapMarkerDraggable,
			icon: 'assets/images/google-map-customer-marker.png'
		});

		if (this.mapMarkerDraggable){

			let _mapMarkerDraggable = this._mapMarker;
			google.maps.event.addListener(_mapMarkerDraggable, 'dragend', (evt) => {
				document.getElementById('current').innerHTML = '<p>Marker dropped: Current Lat: ' + evt.latLng.lat().toFixed(5) + ' Current Lng: ' + evt.latLng.lng().toFixed(5) + '</p>';

				const latLng = new google.maps.LatLng(evt.latLng.lat(), evt.latLng.lng());
				this._emitMapMarkerCoordinates(latLng);
			});
		}

		/* google.maps.event.addListener(this._mapMarker, 'dragstart', function (evt) {
			document.getElementById('current').innerHTML = '<p>Currently dragging marker...</p>';
		}); */
	}

	private _emitCenterMapCoordinates(
		location: google.maps.LatLng | google.maps.LatLngLiteral
	) {
		this.mapCenterCoordinatesEmitter.emit(location);
	}

	private _emitMapMarkerCoordinates(
		location: google.maps.LatLng | google.maps.LatLngLiteral
	) {
		this.mapMarkerCoordinatesEmitter.emit(location);
	}



	private _clearMarker() {
		if (this._mapMarker) {
			this._mapMarker.setMap(null);
		}
	}

	ngOnDestroy() {
		this._ngDestroy$.next();
		this._ngDestroy$.complete();
	}
}
