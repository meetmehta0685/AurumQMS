import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { createClient } from '@/lib/supabase/server';

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const LEFT = 50;
const RIGHT = 545;

function drawWrappedText(
  page: any,
  text: string,
  startY: number,
  font: any,
  fontSize = 11,
  lineHeight = 16
) {
  const maxWidth = RIGHT - LEFT;
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach((word) => {
    const trial = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(trial, fontSize);
    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = trial;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  let y = startY;
  lines.forEach((line) => {
    page.drawText(line, { x: LEFT, y, size: fontSize, font, color: rgb(0.1, 0.1, 0.1) });
    y -= lineHeight;
  });

  return y;
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  try {
    const { appointmentId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase.from('profiles').select('id, user_id, role, full_name').eq('user_id', user.id).single();
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { data: appointment } = await supabase
      .from('appointments')
      .select('id, patient_id, doctor_id, appointment_date, appointment_time, status, patient:profiles!appointments_patient_id_fkey(full_name)')
      .eq('id', appointmentId)
      .single();

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    if (profile.role === 'patient' && appointment.patient_id !== profile.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (profile.role === 'doctor') {
      const { data: doctor } = await supabase.from('doctors').select('id').eq('user_id', user.id).single();
      if (!doctor || doctor.id !== appointment.doctor_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const [medicalRecordRes, dischargeRes, ordersRes, dispensesRes] = await Promise.all([
      supabase
        .from('medical_records')
        .select('id, diagnosis, notes, created_at')
        .eq('appointment_id', appointmentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('discharge_summaries')
        .select('id, summary_text, discharge_status')
        .eq('appointment_id', appointmentId)
        .maybeSingle(),
      supabase
        .from('lab_test_orders')
        .select('id, test_name, status')
        .eq('appointment_id', appointmentId)
        .order('created_at', { ascending: false }),
      supabase
        .from('pharmacy_dispenses')
        .select('medicine_name, dosage, frequency, duration, quantity, dispense_status')
        .eq('patient_id', appointment.patient_id)
        .eq('doctor_id', appointment.doctor_id)
        .order('created_at', { ascending: false })
        .limit(25),
    ]);

    const labOrderIds = (ordersRes.data || []).map((order) => order.id);
    const { data: reports } = labOrderIds.length
      ? await supabase
          .from('lab_reports')
          .select('report_title, reported_at')
          .in('order_id', labOrderIds)
          .order('reported_at', { ascending: false })
      : { data: [] as any[] };

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    let y = PAGE_HEIGHT - 50;

    page.drawText('Hospital Discharge Summary', {
      x: LEFT,
      y,
      size: 20,
      font: titleFont,
      color: rgb(0.05, 0.05, 0.05),
    });

    y -= 28;
    page.drawText(`Generated: ${new Date().toLocaleString()}`, {
      x: LEFT,
      y,
      size: 10,
      font: bodyFont,
      color: rgb(0.35, 0.35, 0.35),
    });

    const appointmentPatient = (appointment as any).patient;
    const patientName = Array.isArray(appointmentPatient)
      ? appointmentPatient[0]?.full_name || 'Unknown'
      : appointmentPatient?.full_name || 'Unknown';

    y -= 26;
    page.drawText(`Patient: ${patientName}`, {
      x: LEFT,
      y,
      size: 12,
      font: titleFont,
    });

    y -= 18;
    page.drawText(`Appointment: ${appointment.appointment_date} ${appointment.appointment_time}`, {
      x: LEFT,
      y,
      size: 11,
      font: bodyFont,
    });

    y -= 24;
    page.drawText('Diagnosis', { x: LEFT, y, size: 13, font: titleFont });
    y -= 18;
    y = drawWrappedText(
      page,
      medicalRecordRes.data?.diagnosis || 'No diagnosis available.',
      y,
      bodyFont
    );

    y -= 10;
    page.drawText('Discharge Notes', { x: LEFT, y, size: 13, font: titleFont });
    y -= 18;
    y = drawWrappedText(
      page,
      dischargeRes.data?.summary_text || medicalRecordRes.data?.notes || 'No discharge notes recorded.',
      y,
      bodyFont
    );

    y -= 10;
    page.drawText('Laboratory Reports', { x: LEFT, y, size: 13, font: titleFont });
    y -= 18;

    if (!reports || reports.length === 0) {
      y = drawWrappedText(page, 'No lab reports available for this visit.', y, bodyFont);
    } else {
      reports.slice(0, 8).forEach((report) => {
        const line = `• ${report.report_title} (${report.reported_at ? new Date(report.reported_at).toLocaleDateString() : 'Date N/A'})`;
        y = drawWrappedText(page, line, y, bodyFont);
      });
    }

    y -= 10;
    page.drawText('Medicines from Pharmacy', { x: LEFT, y, size: 13, font: titleFont });
    y -= 18;

    if (!dispensesRes.data || dispensesRes.data.length === 0) {
      y = drawWrappedText(page, 'No medicines recorded.', y, bodyFont);
    } else {
      dispensesRes.data.slice(0, 10).forEach((medicine) => {
        const line = `• ${medicine.medicine_name} - ${medicine.dosage}, ${medicine.frequency}, ${medicine.duration}, Qty ${medicine.quantity} (${medicine.dispense_status})`;
        y = drawWrappedText(page, line, y, bodyFont);
      });
    }

    y -= 10;
    page.drawText('Status', { x: LEFT, y, size: 13, font: titleFont });
    y -= 18;
    y = drawWrappedText(
      page,
      `Discharge Status: ${dischargeRes.data?.discharge_status || 'draft'}`,
      y,
      bodyFont
    );

    const pdfBytes = await pdfDoc.save();

    await supabase
      .from('discharge_summaries')
      .update({ generated_at: new Date().toISOString() })
      .eq('appointment_id', appointmentId);

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="discharge-summary-${appointmentId}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Failed to generate discharge PDF', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
