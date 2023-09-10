---
title: "Series de tiempo en MongoDB"
date: 2023-09-09
draft: false

description: "En este post vamos a revisar las bondades de esta importante característica de MongoDB. Las series de tiempo nos ayudan a registrar datos que se modifican con el tiempo"
categories: ["MongoDB", "Bases de Datos", "NoSql", "Series de Tiempo", "Time Series", "Time Series Collections", "Colecciones de Series de Tiempo"]
tags: ["MongoDB", "Bases de Datos", "NoSql"]
images: 
- "https://s3.us-east-2.amazonaws.com/brunovelazquez.com.bucket/series-de-tiempo-mongodb.jpg"
---

# Introducción

Los datos de series de tiempo, son colecciones de datos que pueden definirse como una secuencia de "data points" que tienen asociados una estampa de tiempo, es decir, consisten en métricas hechas desde una fuente de datos sobre un determinado periodo de tiempo.

## Ejemplos de series de tiempo

Algunos de los siguientes tipos de datos son adecuados para almacenarse en una colección de series temporales:

 - #### **Datos Meteorológicos**:
     - Temperatura, humedad, presión atmosférica, etc., registrados en intervalos regulares.

 - #### **Datos Financieros**:
    - Precios de acciones, tipos de cambio, etc., que pueden registrarse cada minuto, cada hora, o en cualquier otro intervalo de tiempo.

- #### **Datos de Telemetría**:
    - Información proveniente de sensores en tiempo real, como la velocidad de un automóvil, la altitud de un avión, etc.


## Ejemplos de lo que no es una serie de tiempo

- #### **Registros Únicos de Transacciones**:
    - Datos que representan eventos únicos y no parte de una serie de eventos que se desarrollan a lo largo del tiempo.

- #### **Datos Demográficos**:
    - Información sobre individuos o grupos que no está necesariamente vinculada a una estampa de tiempo específica, como edad, género, educación, etc.

- #### **Grafos de Conexiones o Redes**:
    - Información que representa las relaciones entre diferentes entidades, donde el enfoque principal está en la relación en sí misma y no en cómo cambia esa relación con el tiempo.


# Requisitos

- Contar con MongoDB a partir de la [versión 5.0](https://www.mongodb.com/docs/v5.3/core/timeseries-collections/)
- Establecer un modelo de datos que tenga las siguientes características:
    - `Timestamp` (estampa de tiempo): La fecha y hora en la que fue capturado el dato
    - `Metadata` (se refiere a los datos fuente): es una etiqueta que identifica de forma única la serie y generalmente no cambia
    - `Measurements` (se refiere a las métricas o valores): Se trata de los valores registrados a través del tiempo
- Crear la colección con las características para que sea tratada como serie de tiempo

## Modelo de datos a convertir

Vamos a convertir el siguiente modelo de datos a una serie de tiempos de MongoDB:

```json
{
    "station_id": "12345",
    "location": {
        "type": "Point",
        "coordinates": [-70.6506, -33.4378]
    },
    "timestamp": ISODate("2023-09-08T12:34:56Z"),
    "temperature": 22.5,
    "humidity": 65.0,
    "pressure": 1013.2,
    "wind": {
        "speed": 10.5,
        "direction": 220.0
    },
    "precipitation": {
        "last_hour": 0.0,
        "last_24_hours": 1.2
    },
    "conditions": "Sunny",
    "alerts": [
        {
            "type": "Heat Warning",
            "description": "Temperatures are expected to rise above 30°C today.",
            "start": ISODate("2023-09-08T00:00:00Z"),
            "end": ISODate("2023-09-08T23:59:59Z")
        }
    ]
}
```

Este modelo de datos permite almacenar una amplia variedad de datos meteorológicos de una manera que facilita tanto el almacenamiento como la consulta de los datos. Los datos se almacenan en un formato que facilita la realización de consultas temporales, y se pueden realizar consultas geográficas gracias al uso de GeoJSON para almacenar la ubicación. En este modelo de datos:

- ``station_id``: Es el identificador único de la estación meteorológica que registró los datos.
- ``location``: Es un objeto GeoJSON que almacena la ubicación de la estación meteorológica.
- ``timestamp``: Es la estampa de tiempo que indica cuándo fueron capturados los datos.
- ``temperature``: Es la temperatura registrada en grados Celsius.
- ``humidity``: Es la humedad relativa registrada en porcentaje.
- ``pressure``: Es la presión atmosférica registrada en hectopascales (hPa).
- ``wind``: Es un objeto que almacena la velocidad y la dirección del viento.
- ``speed``: Es la velocidad del viento en km/h.
- ``direction``: Es la dirección del viento en grados.
- ``precipitation``: Es un objeto que almacena la cantidad de precipitación.
- ``last_hour``: Es la cantidad de precipitación en la última hora en mm.
- ``last_24_hours``: Es la cantidad de precipitación en las últimas 24 horas en mm.
- ``conditions``: Es una descripción textual de las condiciones meteorológicas.
- ``alerts``: Es un array que puede contener cero o más alertas meteorológicas.
- ``type``: Es el tipo de alerta.
- ``description``: Es una descripción de la alerta.
- ``start``: Es la fecha y hora de inicio de la alerta.
- ``end``: Es la fecha y hora de fin de la alerta.

## Conversión a serie de tiempo de MongoDB

Para utilizar el modelo de datos proporcionado en una colección de series temporales de MongoDB, se tiene que hacer algunas modificaciones para ajustarlo a las características específicas y requisitos de las series temporales en MongoDB. Aquí está el modelo modificado:

```json
{
    "metadata": {
        "station_id": "12345",
        "location": {
            "type": "Point",
            "coordinates": [-70.6506, -33.4378]
        }
    },
    "timestamp": ISODate("2023-09-08T12:34:56Z"),
    "measurements": {
        "temperature": 22.5,
        "humidity": 65.0,
        "pressure": 1013.2,
        "wind_speed": 10.5,
        "wind_direction": 220.0,
        "precipitation_last_hour": 0.0,
        "precipitation_last_24_hours": 1.2
    },
    "conditions": "Sunny",
    "alerts": [
        {
            "type": "Heat Warning",
            "description": "Temperatures are expected to rise above 30°C today.",
            "start": ISODate("2023-09-08T00:00:00Z"),
            "end": ISODate("2023-09-08T23:59:59Z")
        }
    ]
}
```

## Cambios realizados

- ``Metadatos agrupados``: Los campos de metadatos (`station_id` y `location`) se han agrupado bajo un único campo `metadata`. Esto se alinea con la recomendación de MongoDB de agrupar los metadatos en un campo separado.
- ``Mediciones agrupadas``: Los campos individuales de medición se han agrupado bajo un campo `measurements` para mantener una estructura más organizada.
- ``Flatten Nested Objects``: Los objetos anidados para `wind` y `precipitation` se han "aplanado" para facilitar las consultas y el análisis.

## Creación de la colección

Al crear la colección de series temporales en MongoDB, se debe especificar `timestamp` como el campo de tiempo y `metadata` como el campo de metadatos. A continuación te enseño a crear la colección:

```shell
db.createCollection("weather_data", {
   timeseries: {
     timeField: "timestamp",
     metaField: "metadata",
     granularity: "hours"
   }
})
```

Del comando anterior:

- `timeField`: Es el campo que contiene la estampa de tiempo de cada documento (registro de datos).
- `metaField`: Es el campo que contiene los metadatos que son compartidos entre múltiples documentos en la colección.
- `granularity`: Es una opción para definir el nivel de granularidad del bucketing. He elegido "hours" aquí, pero puedes ajustarlo según tus necesidades.

## Inserción de datos

Ahora que ya hemos creado nuestra colección de series de tiempo podemos insertar datos:

```shell
db.weather_data.insertOne({
    "metadata": {
        "station_id": "12345",
        "location": {
            "type": "Point",
            "coordinates": [-70.6506, -33.4378]
        }
    },
    "timestamp": ISODate("2023-09-08T12:34:56Z"),
    "measurements": {
        "temperature": 22.5,
        "humidity": 65.0,
        "pressure": 1013.2,
        "wind_speed": 10.5,
        "wind_direction": 220.0,
        "precipitation_last_hour": 0.0,
        "precipitation_last_24_hours": 1.2
    },
    "conditions": "Sunny",
    "alerts": [
        {
            "type": "Heat Warning",
            "description": "Temperatures are expected to rise above 30°C today.",
            "start": ISODate("2023-09-08T00:00:00Z"),
            "end": ISODate("2023-09-08T23:59:59Z")
        }
    ]
})
```

## Conclusiones

Como pudimos ver, las series de tiempo están pensadas para contener una gran cantidad de datos en periodos de tiempo cortos. En MongoDB tenemos varias herramientas para trabajar con series de tiempo, una de esas características es el uso de TTL (tiempo de vida de los datos) para ir borrando una vez que expira su tiempo de vida, para lograr esto tenemos que definirlo en la creación de la colección:

```shell
db.createCollection("weather_data", {
   timeseries: {
     timeField: "timestamp",
     metaField: "metadata",
     granularity: "hours"
   },
    expireAfterSeconds: 86400
})
```

Evidentemente el uso de esta característica de MongoDB radica en la compresión de los datos ya que según con su documentación, el algoritmo de compresión de los datos es bajo la librería [zstd](https://www.mongodb.com/docs/manual/reference/glossary/#std-term-zstd) que es más eficiente que [snappy](https://www.mongodb.com/docs/manual/reference/glossary/#std-term-snappy).

Las ventajas de uso de las series de tiempo son:

- ### **Optimización de Almacenamiento**
    - `Compresión`: MongoDB 5.0 introduce mejoras significativas en la compresión de datos de series temporales, permitiendo almacenar más datos en menos espacio.
    - `Esquema` flexible: Puedes aprovechar el modelo de documentos de MongoDB para estructurar datos de series temporales de una manera que facilite las consultas y el análisis.
- ### **Facilidad de Escalabilidad**
    - `Sharding`: MongoDB soporta sharding, lo que facilita la escalabilidad horizontal para manejar grandes volúmenes de datos.
    - `Replicación`: La replicación en MongoDB asegura la disponibilidad y la redundancia de los datos.
- ### **Consultas Eficientes**
    - `Índices`: MongoDB permite crear índices sobre campos específicos, facilitando consultas rápidas y eficientes.
    - `Aggregation` Framework: El framework de agregación de MongoDB es potente y puede ser muy útil para analizar datos de series temporales.
- ### **Integración con Herramientas de Análisis**
    - `Conectores`: MongoDB ofrece conectores para varias herramientas populares de análisis de datos y BI, facilitando la integración con tu stack de herramientas existente.

Si quieres profundizar en el manejo de series de tiempo puedes encontrar [documentación de MongoDB aquí](https://www.mongodb.com/docs/manual/core/timeseries-collections/). Espero que este artículo te aporte algo de conocimiento y lo uses en tus próximos proyectos.