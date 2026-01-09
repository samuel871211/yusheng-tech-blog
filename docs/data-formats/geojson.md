---
title: GeoJSON
description: GeoJSON
last_update:
  date: "2025-04-20T08:00:00+08:00"
---

## Geometry Types

GeoJSON 支援以下幾種幾何類型:

- Point (點)
- LineString (線)
- Polygon (多邊形)
- MultiPoint (多點)
- MultiLineString (多線)
- MultiPolygon (多多邊形)
- GeometryCollection (幾何集合)

使用 https://geojson.io/ 來視覺化 GeoJSON

- Point (點)

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [121.5654, 25.033]
      },
      "properties": {
        "name": "台北 101"
      }
    }
  ]
}
```

- LineString (線)

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [121.5169, 25.0479],
          [121.5177, 25.0346],
          [121.5186, 25.021]
        ]
      },
      "properties": {
        "name": "捷運路線片段"
      }
    }
  ]
}
```

- Polygon (多邊形)

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [121.5169, 25.0479],
            [121.5177, 25.0346],
            [121.53, 25.035],
            [121.528, 25.049],
            [121.5169, 25.0479]
          ]
        ]
      },
      "properties": {
        "name": "北車附近"
      }
    }
  ]
}
```

- MultiPoint (多點)

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "MultiPoint",
        "coordinates": [
          [121.5654, 25.033],
          [121.5455, 25.042],
          [121.5762, 25.029]
        ]
      },
      "properties": {
        "name": "多個景點"
      }
    }
  ]
}
```

- MultiLineString (多線)

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "MultiLineString",
        "coordinates": [
          [
            [121.517, 25.048],
            [121.528, 25.049],
            [121.538, 25.051]
          ],
          [
            [121.5177, 25.0346],
            [121.525, 25.037],
            [121.53, 25.039]
          ]
        ]
      },
      "properties": {
        "name": "台北捷運多條線路",
        "lines": ["紅線部分(非精確)", "藍線部分(非精確)"]
      }
    }
  ]
}
```

- MultiPolygon (多多邊形)

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [
          [
            [
              [121.517, 25.048],
              [121.528, 25.049],
              [121.53, 25.035],
              [121.517, 25.048]
            ]
          ],
          [
            [
              [121.55, 25.06],
              [121.56, 25.065],
              [121.565, 25.055],
              [121.55, 25.06]
            ]
          ]
        ]
      },
      "properties": {
        "name": "台北市多個行政區",
        "districts": ["北車附近", "松山機場附近"]
      }
    }
  ]
}
```

- GeometryCollection (幾何集合)

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "GeometryCollection",
        "geometries": [
          {
            "type": "Point",
            "coordinates": [121.5654, 25.033]
          },
          {
            "type": "LineString",
            "coordinates": [
              [121.5654, 25.033],
              [121.5177, 25.0346]
            ]
          },
          {
            "type": "Polygon",
            "coordinates": [
              [
                [121.53, 25.035],
                [121.538, 25.051],
                [121.55, 25.06],
                [121.53, 25.035]
              ]
            ]
          }
        ]
      },
      "properties": {
        "name": "台北市觀光資訊",
        "description": "包含景點、路線和區域"
      }
    }
  ]
}
```

## GeoJSON 的 TypeScript 定義

```ts
// 座標系統：經度、緯度（可選高度）
type Position =
  | [longitude: number, latitude: number]
  | [longitude: number, latitude: number, altitude: number];

// 幾何類型
interface Point {
  type: "Point";
  coordinates: Position;
  bbox?: number[];
}

interface LineString {
  type: "LineString";
  coordinates: Position[];
  bbox?: number[];
}

interface Polygon {
  type: "Polygon";
  coordinates: Position[][];
  bbox?: number[];
}

interface MultiPoint {
  type: "MultiPoint";
  coordinates: Position[];
  bbox?: number[];
}

interface MultiLineString {
  type: "MultiLineString";
  coordinates: Position[][];
  bbox?: number[];
}

interface MultiPolygon {
  type: "MultiPolygon";
  coordinates: Position[][][];
  bbox?: number[];
}

interface GeometryCollection {
  type: "GeometryCollection";
  geometries: Geometry[];
  bbox?: number[];
}

type Geometry =
  | Point
  | LineString
  | Polygon
  | MultiPoint
  | MultiLineString
  | MultiPolygon
  | GeometryCollection;

// 特徵屬性
interface GeoJsonProperties {
  [key: string]: any;
}

// Feature 物件
interface Feature {
  type: "Feature";
  geometry: Geometry | null;
  properties: GeoJsonProperties | null;
  id?: string | number | null;
  bbox?: number[];
}

// FeatureCollection 物件
interface FeatureCollection {
  type: "FeatureCollection";
  features: Feature[];
  bbox?: number[];
}

// GeoJSON 總型別
type GeoJSON = Geometry | Feature | FeatureCollection;
```

### 參考資料

- https://geojson.io/
- https://geojson.org/
- https://datatracker.ietf.org/doc/html/rfc7946
