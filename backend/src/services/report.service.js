import Disbursement from '../models/Disbursement.model.js';
import Application from '../models/Application.model.js';
import ScholarshipProgram from '../models/ScholarshipProgram.model.js';
import { stringify } from 'csv-stringify/sync';
import PDFDocument from 'pdfkit';

function applyDateFilter(query, from, to) {
  if (from || to) {
    query.releaseDate = query.releaseDate || {};
    if (from) query.releaseDate.$gte = new Date(from);
    if (to) query.releaseDate.$lte = new Date(to);
  }
}

export async function generate({ format, type, programId, district, from, to }) {
  if (type === 'disbursements') {
    const query = { status: 'released' };
    if (programId) query.program = programId;
    applyDateFilter(query, from, to);
    let items = await Disbursement.find(query)
      .populate('student', 'fullName district upazila')
      .populate('program', 'title')
      .sort({ releaseDate: -1 })
      .lean();

    if (district) {
      items = items.filter((d) => d.student?.district === district);
    }

    if (format === 'csv') {
      const rows = items.map((d) => ({
        Date: d.releaseDate,
        Student: d.student?.fullName,
        District: d.student?.district,
        Upazila: d.student?.upazila,
        Program: d.program?.title,
        Amount: d.amount,
        Method: d.paymentMethod,
        Reference: d.transactionReference,
      }));
      const csv = stringify(rows, { header: true });
      return { data: csv, contentType: 'text/csv', filename: `disbursements-${Date.now()}.csv` };
    }

    if (format === 'pdf') {
      return new Promise((resolve, reject) => {
        const doc = new PDFDocument();
        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve({ data: Buffer.concat(chunks), contentType: 'application/pdf', filename: `disbursements-${Date.now()}.pdf` }));
        doc.on('error', reject);
        doc.fontSize(18).text('Disbursement Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10);
        items.slice(0, 100).forEach((d, i) => {
          doc.text(`${i + 1}. ${d.releaseDate?.toISOString?.()?.slice(0, 10)} | ${d.student?.fullName} | ${d.program?.title} | BDT ${d.amount}`);
        });
        doc.end();
      });
    }
  }

  if (type === 'regional') {
    const query = {};
    applyDateFilter(query, from, to);
    const disbursements = await Disbursement.find({ ...query, status: 'released' })
      .populate('student', 'district upazila')
      .lean();
    const byDistrict = {};
    disbursements.forEach((d) => {
      const dist = d.student?.district || 'Unknown';
      if (!byDistrict[dist]) byDistrict[dist] = { count: 0, amount: 0, upazilas: {} };
      byDistrict[dist].count += 1;
      byDistrict[dist].amount += d.amount;
      const up = d.student?.upazila || 'Unknown';
      if (!byDistrict[dist].upazilas[up]) byDistrict[dist].upazilas[up] = { count: 0, amount: 0 };
      byDistrict[dist].upazilas[up].count += 1;
      byDistrict[dist].upazilas[up].amount += d.amount;
    });
    if (format === 'csv') {
      const rows = [];
      Object.entries(byDistrict).forEach(([dist, v]) => {
        Object.entries(v.upazilas).forEach(([up, u]) => {
          rows.push({ district: dist, upazila: up, students: u.count, amount: u.amount });
        });
      });
      const csv = stringify(rows, { header: true });
      return { data: csv, contentType: 'text/csv', filename: `regional-${Date.now()}.csv` };
    }
    if (format === 'pdf') {
      return new Promise((resolve, reject) => {
        const doc = new PDFDocument();
        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () =>
          resolve({
            data: Buffer.concat(chunks),
            contentType: 'application/pdf',
            filename: `regional-${Date.now()}.pdf`,
          })
        );
        doc.on('error', reject);

        doc.fontSize(18).text('Regional Impact Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10);
        Object.entries(byDistrict).forEach(([dist, v], idx) => {
          doc.text(`${idx + 1}. ${dist} — Students: ${v.count}, Amount: BDT ${v.amount}`);
          Object.entries(v.upazilas).slice(0, 8).forEach(([up, u]) => {
            doc.text(`   • ${up}: ${u.count} students, BDT ${u.amount}`);
          });
          doc.moveDown(0.5);
        });
        doc.end();
      });
    }
    return { data: byDistrict, contentType: 'application/json', filename: null };
  }

  return { data: [], contentType: 'application/json', filename: null };
}

export default { generate };
