'use strict';

function statsForAdmin(role, stats) {
  if (role !== 'manager') return stats;
  return { members: stats.members, groups: stats.groups };
}

function dashboardForAdmin(role, data) {
  if (role !== 'manager') return data;
  const k = data.k || {};
  return {
    k: {
      members: k.members,
      pending_members: k.pending_members,
      groups: k.groups
    },
    pay: [],
    reg: Array.isArray(data.reg) ? data.reg : []
  };
}

function peopleForAdmin(role, people) {
  if (role !== 'manager') return people;
  return people.map(({ total, n, ...member }) => member);
}

module.exports = { statsForAdmin, dashboardForAdmin, peopleForAdmin };
