# Todo Prototype for Dev

This dev-only prototype creates the following in `narainkarthik812-practice-dev`:

- A backend Cloud Function Gen 2 for the todo API
- A frontend Cloud Function Gen 2 for the UI
- An API Gateway in front of the backend
- A reserved global static IP and external HTTP load balancer in front of the frontend
- A dedicated Cloud SQL database and user on the existing instance `narainkarthik812-practice-dev-postgres`
- Service accounts and IAM bindings required by the serverless functions and gateway

## Source folders

- Backend: `../../../todolist-app/backend`
- Frontend: `../../../todolist-app/frontend`

## Terraform files

- Main prototype stack: `todo.tf`
- API Gateway OpenAPI spec: `todo-openapi.yaml.tpl`
- Outputs: `outputs.tf`

## Deploy

Run from `environments/dev`:

```bash
chmod +x ./deploy-todo-prototype.sh
./deploy-todo-prototype.sh
```

## Notes

- This implementation uses Cloud Functions Gen 2 because your original request asked for JavaScript Cloud Functions deployment from source, while still giving Cloud Run based runtime behavior under the hood.
- API Gateway is attached to the backend API. The frontend is exposed through the load balancer and static IP, with function ingress limited to `ALLOW_INTERNAL_AND_GCLB`.
- The backend uses a Serverless VPC Access connector to reach the private Cloud SQL address.
