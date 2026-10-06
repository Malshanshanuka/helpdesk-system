import Ticket from "../models/Ticket.js";

const toMap = (rows) =>
  rows.reduce((acc, row) => {
    acc[row._id] = row.count;
    return acc;
  }, {});

export const getStats = async (req, res) => {
  try {
    const [byStatus, byPriority, byCategory, total, unassigned, last7Days] = await Promise.all([
      Ticket.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Ticket.aggregate([{ $group: { _id: "$priority", count: { $sum: 1 } } }]),
      Ticket.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]),
      Ticket.countDocuments(),
      Ticket.countDocuments({ assignedTo: null, status: { $in: ["open", "in_progress"] } }),
      Ticket.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.json({
      total,
      unassigned,
      byStatus: toMap(byStatus),
      byPriority: toMap(byPriority),
      byCategory: toMap(byCategory),
      last7Days: last7Days.map((d) => ({ date: d._id, count: d.count })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMyStats = async (req, res) => {
  try {
    const mine = { assignedTo: req.user._id };

    const [byStatus, resolvedCount] = await Promise.all([
      Ticket.aggregate([{ $match: mine }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      Ticket.countDocuments({ ...mine, status: { $in: ["resolved", "closed"] } }),
    ]);

    const map = toMap(byStatus);
    const total = Object.values(map).reduce((a, b) => a + b, 0);

    res.json({
      total,
      open: map.open || 0,
      inProgress: map.in_progress || 0,
      resolved: resolvedCount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};