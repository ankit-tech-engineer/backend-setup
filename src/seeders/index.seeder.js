require('dotenv').config();
const mongoose = require('mongoose');
const { env } = require('../config/env.config');
const Action = require('../modules/acl/actions/actions.model');
const Resource = require('../modules/acl/resources/resources.model');
const Role = require('../modules/acl/roles/roles.model');

const actions = [
  { name: 'Create', key: 'create' },
  { name: 'Read',   key: 'read'   },
  { name: 'Update', key: 'update' },
  { name: 'Delete', key: 'delete' },
  { name: 'List',   key: 'list'   },
];

const resources = [
  { name: 'User',       key: 'user'       },
  { name: 'Role',       key: 'role'       },
  { name: 'Permission', key: 'permission' },
  { name: 'Action',     key: 'action'     },
  { name: 'Resource',   key: 'resource'   },
];

const roles = [
  { name: 'Super Admin', key: 'super_admin' },
  { name: 'Admin',       key: 'admin'       },
  { name: 'Guest',       key: 'guest'       },
];

// findOne by key — if not found, create new doc via save() so pre-save hook fires
const upsert = async (Model, data) => {
  const existing = await Model.findOne({ key: data.key });
  if (existing) return existing;
  const doc = new Model(data);
  return await doc.save();
};

const seed = async () => {
  await mongoose.connect(env.MONGO_URI);
  console.log('DB connected. Running seeder...');

  for (const a of actions)   await upsert(Action,   a);
  console.log(`✔ ${actions.length} actions seeded`);

  for (const r of resources) await upsert(Resource, r);
  console.log(`✔ ${resources.length} resources seeded`);

  for (const r of roles)     await upsert(Role,     r);
  console.log(`✔ ${roles.length} roles seeded`);

  console.log('Seeding complete.');
  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seeder failed:', err.message);
  process.exit(1);
});
