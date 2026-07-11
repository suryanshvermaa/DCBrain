# Agent Rules & Customizations

## Docker Volume & Dependency Management
- **Managing Dependencies**: To manage `node_modules` exclusively inside Docker and avoid host volume sync conflicts with anonymous volumes, DO NOT run `npm install` on the local Windows host.
- Always use `docker compose exec <service> npm install <package>` to install new packages directly into the container's active volume.
- When you need to completely rebuild an image and flush old anonymous volumes, run `docker compose up -d --build -V` (the `-V` flag renews anonymous volumes) to ensure the new node_modules from the built image correctly override the stale anonymous volume.
