
# URL Shortener for MVP

Software used by MELI's marketing team messaging services to reduce the number of characters in URLs in messages.



## Features

- Generates and returns a short URL from a long URL.
- Return a long URL from a short URL.
- Get statistics from a short URL.
- Remove a short URL on demand.
- Redirect to a long URL from a short URL.


## Tech Stack

- Node.js
- Express.js
- Redis
- Amazon DynamoDB Local
- Docker
- **Libraries**: aws-sdk, nanoid, crypto, etc.


## Author

- Github: [@francotova](https://www.github.com/francotova)
- LinkedIn: [@Franco Tovagliare Chacón](https://www.linkedin.com/in/franco-tovagliare/)
- Gmail: @francotova11@gmail.com


## API Reference

#### Generate a short url from a long url

```http
  POST /shorten
```

| Body | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `longUrl` | `string` | **Required**. Long URL to shorten. |

#### Get a long URL from a short URL

```http
  GET /expand/${shortUrl}
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `shortUrl`      | `string` | **Required**. Short URL to expand. |

#### Get statistics from a short URL.

```http
  GET /stats/${shortUrl}
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `shortUrl`      | `string` | **Required**. Short URL to view statistics. |

#### Remove a short URL.

```http
  DELETE /${shortUrl}
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `shortUrl`      | `string` | **Required**. Short URL to delete. |


#### View more information of tables in DynamoDB:

#### View created tables

```http
  GET /bdview/tables
```

#### View data in table

```http
  GET /bdview/tables/${tableName}
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `tableName`      | `string` | **Required**. Name of the table to view data. |




## Run Locally

#### Requirements for running the local application.
- Node.js installed
- Docker installed and running
- NPM (Node Package Manager)

#### Open a console and execute these commands sequentially:
- Clone the project

```bash
  git clone https://github.com/francotova/url-shortener.git
```

- Go to the project directory

```bash
  cd url-shortener
```

- Install dependencies

```bash
  npm install
```

- Running docker-compose configure DynamoDB and Redis containers on Docker Engine

```bash
  docker-compose up -d
```

- Start the server locally

```bash
  npm run local
```



## Feedback

For any comments you may have about the application, please contact me at the above addresses.


## Architecture on AWS

![App Screenshot](https://i.ibb.co/9YbjBNf/Captura-de-pantalla-2023-08-11-113949.png)

