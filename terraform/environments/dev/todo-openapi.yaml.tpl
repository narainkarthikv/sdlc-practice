swagger: "2.0"
info:
  title: todolist-dev-api
  version: "1.0.0"
schemes:
  - https
produces:
  - application/json
consumes:
  - application/json
paths:
  /health:
    get:
      operationId: health
      x-google-backend:
        address: ${backend_address}
        path_translation: APPEND_PATH_TO_ADDRESS
        jwt_audience: ${backend_audience}
      responses:
        "200":
          description: OK
  /todos:
    get:
      operationId: listTodos
      x-google-backend:
        address: ${backend_address}
        path_translation: APPEND_PATH_TO_ADDRESS
        jwt_audience: ${backend_audience}
      responses:
        "200":
          description: Todo list
    post:
      operationId: createTodo
      x-google-backend:
        address: ${backend_address}
        path_translation: APPEND_PATH_TO_ADDRESS
        jwt_audience: ${backend_audience}
      parameters:
        - in: body
          name: body
          required: true
          schema:
            type: object
      responses:
        "201":
          description: Created
  /todos/{id}:
    patch:
      operationId: updateTodo
      x-google-backend:
        address: ${backend_address}
        path_translation: APPEND_PATH_TO_ADDRESS
        jwt_audience: ${backend_audience}
      parameters:
        - name: id
          in: path
          required: true
          type: string
        - in: body
          name: body
          required: true
          schema:
            type: object
      responses:
        "200":
          description: Updated
    delete:
      operationId: deleteTodo
      x-google-backend:
        address: ${backend_address}
        path_translation: APPEND_PATH_TO_ADDRESS
        jwt_audience: ${backend_audience}
      parameters:
        - name: id
          in: path
          required: true
          type: string
      responses:
        "204":
          description: Deleted
