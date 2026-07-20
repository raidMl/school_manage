const express = require('express');
const asyncHandler = require('./asyncHandler');
const HttpError = require('./httpError');
const { query } = require('../config/db');

function escapeIdentifier(identifier) {
  return `\`${identifier.replace(/`/g, '``')}\``;
}

function toSetClause(fields) {
  return fields.map((field) => `${escapeIdentifier(field)} = ?`).join(', ');
}

function pickAllowedFields(source, allowedFields) {
  return allowedFields.reduce((accumulator, field) => {
    if (source[field] !== undefined) {
      accumulator[field] = source[field];
    }

    return accumulator;
  }, {});
}

function createCrudRouter({
  table,
  idColumn = 'id',
  fields = [],
  requiredFields = [],
  searchableFields = [],
}) {
  const router = express.Router();
  const tableName = escapeIdentifier(table);
  const idName = escapeIdentifier(idColumn);

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const whereClauses = [];
      const params = [];

      searchableFields.forEach((field) => {
        if (req.query[field] !== undefined && req.query[field] !== '') {
          whereClauses.push(`${escapeIdentifier(field)} = ?`);
          params.push(req.query[field]);
        }
      });

      const sql = `SELECT * FROM ${tableName}${whereClauses.length ? ` WHERE ${whereClauses.join(' AND ')}` : ''} ORDER BY ${idName} DESC`;
      const rows = await query(sql, params);

      res.json({ data: rows });
    })
  );

  router.get(
    '/:id',
    asyncHandler(async (req, res) => {
      const rows = await query(`SELECT * FROM ${tableName} WHERE ${idName} = ? LIMIT 1`, [req.params.id]);

      if (!rows.length) {
        throw new HttpError(404, `${table} record not found`);
      }

      res.json({ data: rows[0] });
    })
  );

  router.post(
    '/',
    asyncHandler(async (req, res) => {
      const payload = pickAllowedFields(req.body, fields);

      requiredFields.forEach((field) => {
        if (payload[field] === undefined || payload[field] === null || payload[field] === '') {
          throw new HttpError(400, `${field} is required`);
        }
      });

      const keys = Object.keys(payload);

      if (!keys.length) {
        throw new HttpError(400, 'No valid fields were provided');
      }

      const columns = keys.map(escapeIdentifier).join(', ');
      const placeholders = keys.map(() => '?').join(', ');
      const values = keys.map((key) => payload[key]);

      const result = await query(`INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`, values);
      const created = await query(`SELECT * FROM ${tableName} WHERE ${idName} = ? LIMIT 1`, [result.insertId]);

      res.status(201).json({ data: created[0] });
    })
  );

  router.put(
    '/:id',
    asyncHandler(async (req, res) => {
      const payload = pickAllowedFields(req.body, fields);
      const keys = Object.keys(payload);

      if (!keys.length) {
        throw new HttpError(400, 'No valid fields were provided');
      }

      const values = keys.map((key) => payload[key]);
      values.push(req.params.id);

      await query(`UPDATE ${tableName} SET ${toSetClause(keys)} WHERE ${idName} = ?`, values);
      const updated = await query(`SELECT * FROM ${tableName} WHERE ${idName} = ? LIMIT 1`, [req.params.id]);

      if (!updated.length) {
        throw new HttpError(404, `${table} record not found`);
      }

      res.json({ data: updated[0] });
    })
  );

  router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      const result = await query(`DELETE FROM ${tableName} WHERE ${idName} = ?`, [req.params.id]);

      if (!result.affectedRows) {
        throw new HttpError(404, `${table} record not found`);
      }

      res.status(204).send();
    })
  );

  return router;
}

module.exports = createCrudRouter;