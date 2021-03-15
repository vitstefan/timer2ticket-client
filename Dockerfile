# credits: https://medium.com/bb-tutorials-and-thoughts/how-to-serve-angular-application-with-nginx-and-docker-3af45be5b854

FROM node:14-alpine as builder

COPY . /app
WORKDIR /app

# Build the project and copy the files
RUN npm install && npm run ng build -- --deploy-url=/ --prod

FROM nginx:alpine

COPY ./.nginx/default.conf.template /etc/nginx/templates/
COPY --from=builder /app/dist/timer2ticket-client/ /usr/share/nginx/html/

EXPOSE 80
