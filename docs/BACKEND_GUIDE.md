# IT Helpdesk Backend: Notes සහ Postman Test Guide

## කොටස 1: Backend එකේ සාරාංශය (Notes)

### 1.1 Tech stack
Node.js, Express 5, MongoDB Atlas, Mongoose 9, JWT (jsonwebtoken), bcryptjs, Multer (file upload), Nodemailer (email).

### 1.2 Folder structure (MVC pattern)

```
server/
  config/db.js                 MongoDB connection
  models/                      Data හැඩය: User, Ticket, Counter, Comment, Activity
  controllers/                 Business logic: auth, user, ticket, comment, stats
  routes/                      URL එක controller එකට සම්බන්ධ කරනවා
  middleware/                  authMiddleware (protect, authorize), uploadMiddleware
  utils/                       generateToken, logActivity, sendEmail
  uploads/                     Attachments (git එකට යන්නේ .gitkeep විතරයි)
  seedAdmin.js                 පළමු admin හදන script එක
  server.js                    App entry point
```

Request එකක ගමන: `Route -> Middleware (protect, authorize) -> Controller -> Model -> MongoDB -> Response`

### 1.3 Models

| Model | ප්‍රධාන fields |
|---|---|
| User | name, email (unique), password (hashed, select:false), role, department, isActive |
| Ticket | ticketNumber (1001...), title, description, category, priority, status, createdBy, assignedTo |
| Counter | name, seq (ticket number auto increment කරන්න) |
| Comment | ticket, author, message, attachments[] |
| Activity | ticket, actor, action, details |

Enum අගයන්:
- role: `employee`, `it_support`, `admin`
- priority: `low`, `medium`, `high`, `critical`
- status: `open`, `in_progress`, `resolved`, `closed`
- category: `computer`, `network`, `account`, `email`, `software`, `other`

### 1.4 API endpoints

| Method | URL | කවුද පාවිච්චි කරන්නේ |
|---|---|---|
| GET | /api/health | ඕනෑම කෙනෙක් |
| POST | /api/auth/register | ඕනෑම කෙනෙක් (හැමෝම employee වෙනවා) |
| POST | /api/auth/login | ඕනෑම කෙනෙක් |
| GET | /api/auth/me | Login වුණ කෙනෙක් |
| GET | /api/users | Admin |
| PATCH | /api/users/:id/role | Admin |
| PATCH | /api/users/:id/status | Admin |
| POST | /api/tickets | Login වුණ කෙනෙක් |
| GET | /api/tickets | Employee: තමන්ගේ ඒවා. Staff: හැම එකම |
| GET | /api/tickets/:id | Owner හෝ staff |
| PATCH | /api/tickets/:id/status | IT Support, Admin |
| PATCH | /api/tickets/:id/assign | IT Support, Admin |
| GET | /api/tickets/:id/comments | Owner හෝ staff |
| POST | /api/tickets/:id/comments | Owner හෝ staff (file attach කරන්න පුළුවන්) |
| GET | /api/tickets/:id/activity | Owner හෝ staff |
| GET | /api/files/:filename | Login වුණ කෙනෙක් |
| GET | /api/stats | Admin |
| GET | /api/stats/me | IT Support, Admin |

Query params (`GET /api/tickets`): `status`, `priority`, `category`, `assignedTo` (`me` හෝ `unassigned`), `search`, `page`, `limit`.

### 1.5 වැදගත් සංකල්ප (Interview එකකදී කියන්න)

- **bcrypt**: Password එක hash කරලා save කරනවා. ආපහු password එකට හරවන්න බෑ.
- **JWT**: Login වුණාම server දෙන token එක. හැම request එකටම `Authorization: Bearer <token>` header එකෙන් යවනවා.
- **protect middleware**: Token එක නිවැරදිද බලලා `req.user` හදනවා. නැත්නම් 401.
- **authorize middleware**: Role එක බලනවා. අවසර නැත්නම් 403.
- **401 vs 403**: 401 = ඔබ කවුද දන්නේ නෑ. 403 = දන්නවා, ඒත් අවසර නෑ.
- **Role escalation වැළැක්වීම**: Register එකේදී body එකෙන් role ගන්නේ නෑ.
- **Ownership check**: Employee කෙනෙක්ට වෙන කෙනෙකුගේ ticket බලන්න බෑ.
- **Atomic counter**: `$inc` + `upsert` මගින් ticket number දෙපාරක් එකම වෙන්නේ නෑ.
- **Regex escape**: Search එකේ user දාන special characters නිසා query බිඳෙන්නේ නෑ.
- **File upload security**: Random file names, type සහ size limit, `path.basename` මගින් path traversal වැළැක්වීම, files බලන්න login අනිවාර්යයි.
- **Email failure isolation**: Email යන්න බැරි වුණාට API request එක fail වෙන්නේ නෑ.
- **Activity log**: Ticket එකේ හැම වෙනසක්ම audit trail එකක් විදියට save වෙනවා.

### 1.6 දැනට තියෙන දුර්වලතා (පස්සේ හදමු)
- වැරදි `category`/`priority` අගයක් හෝ වැරදි format එකේ `_id` එකක් දුන්නොත් 400 වෙනුවට 500 එනවා (Mongoose ValidationError/CastError handle කරලා නෑ).
- Rate limiting නෑ (login brute force වළක්වන්න `express-rate-limit` පස්සේ දාමු).
- Security headers නෑ (`helmet` පස්සේ දාමු).

---

## කොටස 2: Postman වලින් මුල ඉඳන් අගට test කිරීම

### 2.0 Postman setup (එක පාරක් විතරයි)

**Environment හදන්න**
1. Postman වම් පැත්තේ **Environments** -> **+** -> නම: `Helpdesk Local`
2. Variables:

| Variable | Initial value |
|---|---|
| baseUrl | http://localhost:5001/api |
| adminToken | (හිස්) |
| employeeToken | (හිස්) |
| employee2Token | (හිස්) |
| ticketId | (හිස්) |
| employeeId | (හිස්) |
| adminId | (හිස්) |

3. **Save** කරලා, උඩ දකුණු කෙළවරේ environment එක `Helpdesk Local` තෝරන්න.

**Collection හදන්න**: **Collections** -> **+** -> නම: `Helpdesk API`. හැම request එකක්ම මේකට save කරන්න.

**Token auto save කරන ක්‍රමය** (Login request එකේ **Scripts** හෝ **Tests** tab එකේ):

```js
// Admin login request
pm.environment.set("adminToken", pm.response.json().token);
pm.environment.set("adminId", pm.response.json()._id);
```

Employee login එකේ `adminToken` වෙනුවට `employeeToken`, `adminId` වෙනුවට `employeeId` දාන්න.

**Token එක request එකකට දාන විදිය**: request එකේ **Authorization** tab -> Type: **Bearer Token** -> Token: `{{adminToken}}` (හෝ `{{employeeToken}}`).

**JSON body**: **Body** tab -> **raw** -> දකුණට **JSON** තෝරන්න.

Server run වෙනවද බලන්න: `cd ~/Documents/helpdesk-system/server && npm run dev`

---

### 2.1 Health check

| # | Request | බලාපොරොත්තුව |
|---|---|---|
| 1 | GET `{{baseUrl}}/health` | 200, `status: ok` |

### 2.2 Authentication

**Test 2: Employee register**
- POST `{{baseUrl}}/auth/register`
```json
{ "name": "Malshan Shanuka", "email": "malshan@test.com", "password": "123456", "department": "Engineering" }
```
- 201, `role: employee`. (Email දැනටමත් තියෙනවා නම් 400 එනවා, ඒක සාමාන්‍යයි. Test 4 එකට යන්න.)

**Test 3: දෙවෙනි employee register** (access control test වලට)
```json
{ "name": "Kasun Perera", "email": "kasun@test.com", "password": "123456", "department": "Finance" }
```
- 201

**Test 4: Duplicate email**: Test 2 request එකම ආයෙ යවන්න -> 400 `Email is already registered`

**Test 5: Missing fields**: `{ "email": "x@test.com" }` -> 400

**Test 6: Role එක body එකෙන් දාන්න බලනවා**
```json
{ "name": "Hacker", "email": "hacker@test.com", "password": "123456", "role": "admin" }
```
- 201 ඒත් response එකේ `role: employee` වෙන්න ඕනේ (security check).

**Test 7: Admin login** (seed කරලා නැත්නම් `npm run seed:admin` මුලින් run කරන්න)
- POST `{{baseUrl}}/auth/login`: `{ "email": "admin@helpdesk.com", "password": "Admin@12345" }`
- 200, `role: admin`. Tests tab script එකෙන් `adminToken` save වෙනවා.

**Test 8: Employee login** (`malshan@test.com`) -> 200, `employeeToken` save කරන්න.

**Test 9: Kasun login** -> 200, `employee2Token` save කරන්න (script එකේ variable නම `employee2Token` කරන්න).

**Test 10: වැරදි password**: -> 401 `Invalid email or password`

**Test 11: Profile**: GET `{{baseUrl}}/auth/me`, Bearer `{{employeeToken}}` -> 200, password field නෑ.

**Test 12: Token නැතුව `/auth/me`** -> 401 `Not authorized, no token`

**Test 13: වැරදි token**: Bearer token එකට `abc123` දාන්න -> 401 `token invalid`

### 2.3 User management (Admin)

**Test 14: Admin users list**: GET `{{baseUrl}}/users`, `{{adminToken}}` -> 200. Users ලා ඉන්නවා. `malshan@test.com` ගේ `_id` එක `employeeId` variable එකට save කරන්න.

**Test 15: Employee users list**: `{{employeeToken}}` -> 403

**Test 16: Role වෙනස් කිරීම**: PATCH `{{baseUrl}}/users/{{employeeId}}/role`, `{{adminToken}}`
```json
{ "role": "it_support" }
```
- 200. පස්සේ ආයෙ `{ "role": "employee" }` යවලා employee කරන්න (ticket tests වලට employee ඕනේ).

**Test 17: වැරදි role**: `{ "role": "boss" }` -> 400 `Invalid role`

**Test 18: Admin තමන්ගේ role**: PATCH `{{baseUrl}}/users/{{adminId}}/role`, `{ "role": "employee" }` -> 400 `You cannot change your own role`

**Test 19: User deactivate**: PATCH `{{baseUrl}}/users/<kasun_id>/status`, `{ "isActive": false }` -> 200
- Kasun ගෙන් login කරන්න බලන්න -> 403 `Account is deactivated`
- ආයෙ `{ "isActive": true }` කරලා activate කරන්න.

**Test 20: Admin තමන්ව deactivate කරන්න**: `{{adminId}}` -> 400

### 2.4 Tickets

**Test 21: Ticket හදනවා**: POST `{{baseUrl}}/tickets`, `{{employeeToken}}`
```json
{ "title": "Laptop cannot connect to WiFi", "description": "My laptop cannot connect to the office WiFi since morning.", "category": "network", "priority": "high" }
```
- 201, `ticketNumber`, `status: open`. Tests tab එකේ: `pm.environment.set("ticketId", pm.response.json()._id);`

**Test 22: Missing fields**: `{ "title": "Only title" }` -> 400

**Test 23: Employee ගේ list**: GET `{{baseUrl}}/tickets`, `{{employeeToken}}` -> 200, `{ tickets, page, total, totalPages }`

**Test 24: වෙන employee ගේ list** (`{{employee2Token}}`) -> 200, `tickets` හිස් (Malshan ගේ ticket එක පේන්නේ නෑ).

**Test 25: Admin ගේ list** -> 200, හැම ticket එකම.

**Test 26: Filters**
- `{{baseUrl}}/tickets?priority=high`
- `{{baseUrl}}/tickets?status=open&category=network`
- `{{baseUrl}}/tickets?assignedTo=unassigned` (admin)
- `{{baseUrl}}/tickets?page=1&limit=5`

**Test 27: Search**
- `?search=wifi` -> ticket එක එනවා
- `?search=1001` (ticket number) -> ticket එක එනවා
- `?search=(` -> 500 නෑ, හිස් result එකක්

**Test 28: Ticket එක බලනවා**: GET `{{baseUrl}}/tickets/{{ticketId}}`
- Owner (`{{employeeToken}}`) -> 200
- Admin -> 200
- වෙන employee (`{{employee2Token}}`) -> 403
- Ticket නැති id එකක් (`000000000000000000000000`) -> 404

**Test 29: Status වෙනස් කිරීම**: PATCH `{{baseUrl}}/tickets/{{ticketId}}/status`
- `{{employeeToken}}`, `{ "status": "resolved" }` -> 403
- `{{adminToken}}`, `{ "status": "in_progress" }` -> 200
- `{{adminToken}}`, `{ "status": "done" }` -> 400 `Invalid status`

**Test 30: Assign කිරීම**: PATCH `{{baseUrl}}/tickets/{{ticketId}}/assign`, `{{adminToken}}`
- `{ "assignedTo": "{{adminId}}" }` -> 200, `assignedTo` එකේ admin ගේ නම
- `{ "assignedTo": "{{employeeId}}" }` (employee කෙනෙක්) -> 400 `only be assigned to IT support staff`
- `{ "assignedTo": null }` -> 200 (unassign)

### 2.5 Comments සහ attachments

**Test 31: Employee comment**: POST `{{baseUrl}}/tickets/{{ticketId}}/comments`, `{{employeeToken}}`, `{ "message": "Still not working after restart" }` -> 201

**Test 32: Admin reply**: `{{adminToken}}`, `{ "message": "Please forget the network and reconnect" }` -> 201

**Test 33: Comments list**: GET `.../comments` -> 200, පණිවිඩ දෙක පිළිවෙලට.

**Test 34: වෙන employee comment කරන්න/බලන්න** (`{{employee2Token}}`) -> 403

**Test 35: හිස් comment**: `{ "message": "" }` -> 400

**Test 36: File attach**: POST `.../comments`, `{{employeeToken}}`
- **Body** -> **form-data**
- Key `message` (Text) = `Screenshot attached`
- Key `attachments` (දකුණු කෙළවරේ dropdown එකෙන් **File** තෝරන්න) -> image එකක් select කරන්න
- 201, `attachments[0].filename` එකක්. `server/uploads` folder එකේ file එක හැදෙනවා.

**Test 37: වැරදි file type**: එකම request, `.zip` file එකක් -> 400 `Only images, PDF and text files are allowed`

**Test 38: File බලනවා**: GET `{{baseUrl}}/files/<filename>`, Bearer token එක්ක -> 200, image එක පෙනෙනවා. Token නැතුව -> 401.

### 2.6 Activity log

**Test 39**: GET `{{baseUrl}}/tickets/{{ticketId}}/activity`, `{{adminToken}}` -> 200. `created`, `status_changed`, `assigned`, `commented` සටහන් පිළිවෙලට.

### 2.7 Statistics

| # | Request | බලාපොරොත්තුව |
|---|---|---|
| 40 | GET `{{baseUrl}}/stats` (admin) | 200, total, byStatus, byPriority, byCategory, last7Days |
| 41 | GET `{{baseUrl}}/stats` (employee) | 403 |
| 42 | GET `{{baseUrl}}/stats/me` (admin) | 200, total, open, inProgress, resolved |

### 2.8 Email notifications

**Test 43: Disabled mode**: `.env` හි `EMAIL_ENABLED=false`. Ticket එකක් හදන්න. Server terminal එකේ `Email skipped (disabled): ...` පෙනෙන්න ඕනේ.

**Test 44: Real email**
1. `.env` හි `EMAIL_USER`, `EMAIL_PASS` (App Password), `EMAIL_FROM` පුරවලා `EMAIL_ENABLED=true` කරන්න.
2. Atlas -> Browse Collections -> `users` -> `malshan@test.com` ගේ `email` එක ඔබේ සැබෑ email එකට වෙනස් කරන්න.
3. Ticket හදන්න, status වෙනස් කරන්න, assign කරන්න. Inbox (සහ Spam) බලන්න.

---

### 2.9 අවසන් Checklist

- [ ] Auth: register, login, me, වැරදි token cases
- [ ] Roles: admin, employee, it_support access වෙනස්කම්
- [ ] Tickets: create, list, filter, search, pagination, status, assign
- [ ] Access control: වෙන employee කෙනෙකුට 403
- [ ] Comments සහ file upload (නිවැරදි සහ වැරදි type)
- [ ] Activity log
- [ ] Stats
- [ ] Email (disabled සහ enabled)

හැම test එකකම Status code එක බලාපොරොත්තුවට සමානද කියලා tick කරන්න. Fail එකක් තිබුණොත් response එකයි server terminal error එකයි copy කරලා tech lead ට (මට) එවන්න.
