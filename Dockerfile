# Use nginx alpine for a lightweight static server
FROM nginx:alpine

# Copy the game files to nginx html directory
COPY index.html /usr/share/nginx/html/
COPY index.htm /usr/share/nginx/html/
COPY Scripts/ /usr/share/nginx/html/Scripts/
COPY Content/ /usr/share/nginx/html/Content/

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
