import { NextRequest, NextResponse } from 'next/server';
import { HospitalRepo } from '@/lib/db/repo';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search');
    const all = searchParams.get('all') === 'true';

    if (search) {
      const results = await HospitalRepo.searchFAQs(search);
      return NextResponse.json({ success: true, data: results });
    }

    const faqs = await HospitalRepo.getFAQs(category, !all);
    return NextResponse.json({ success: true, data: faqs });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newFaq = await HospitalRepo.createFAQ({
      category: body.category,
      question: body.question,
      answer: body.answer,
      keywords: Array.isArray(body.keywords)
        ? body.keywords
        : (body.keywords || '').split(',').map((k: string) => k.trim()),
      is_active: body.is_active !== false,
    });
    return NextResponse.json({ success: true, data: newFaq });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: 'FAQ ID required' }, { status: 400 });
    }

    if (updates.keywords && typeof updates.keywords === 'string') {
      updates.keywords = updates.keywords.split(',').map((k: string) => k.trim());
    }

    const updated = await HospitalRepo.updateFAQ(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'FAQ not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'FAQ ID required' }, { status: 400 });
    }
    const deleted = await HospitalRepo.deleteFAQ(id);
    return NextResponse.json({ success: deleted });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
