# API for *trip.pictures*

(frontend: [trip-pictures-ui](https://github.com/martpet/trip-pictures-ui))

## How to run

### Database
- Create a PostgreSQL database named *trip-pictures* without username and password.

### npm deps
- `npm install`

### Env vars
- Copy *.env.example* as *.env*

### Dev server
- Start it with `npm run develop`

### Admin account
- Go to the [Strapi admin](http://localhost:1337/admin) and create your acount.

### Strapi config
- Go to *Plugins > Config Sync*,
- click *Import* and confirm.

### *Facebook OAuth* config
- Go to *General > Settings > Providers > Facebook*,
- set *Enable* to *ON*,
- set *Client ID* (ask),
- set *Client Secret* (ask),
- set *redirect URL* to `http://localhost:3001/facebookAuthRedirect.html`,
- click *Save*.
