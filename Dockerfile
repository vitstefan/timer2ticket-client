# credits: https://medium.com/bb-tutorials-and-thoughts/how-to-serve-angular-application-with-nginx-and-docker-3af45be5b854

FROM node:14-alpine as builder

COPY ["package.json", "package-lock.json*", "tsconfig.json", "./"]

RUN npm install && mkdir /app && mv ./node_modules ./app

WORKDIR /app

COPY . .

# Build the project and copy the files
RUN npm run ng build -- --deploy-url=/ --prod

FROM nginx:alpine

#!/bin/sh

COPY ./.nginx/nginx.conf /etc/nginx/nginx.conf

# Remove default nginx index page
RUN rm -rf /usr/share/nginx/html/*

# Copy from the stage 1
COPY --from=builder /app-ui/dist /usr/share/nginx/html

EXPOSE 4200 80

ENTRYPOINT ["nginx", "-g", "daemon off;"]