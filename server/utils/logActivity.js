import Activity from "../models/Activity.js";

const logActivity = (ticketId, actorId, action, details = "") =>
  Activity.create({ ticket: ticketId, actor: actorId, action, details });

export default logActivity;