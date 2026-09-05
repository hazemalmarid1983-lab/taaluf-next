/**
 * وسائل مصمّمة عربياً تُضاف فوق البنك المستورد من ملف الإكسل.
 *
 * تُحفظ هنا لا في lib/data/autismToolsBank.ts لأن ذاك ملف مولّد آلياً،
 * فأي إضافة داخله تُفقد عند إعادة الاستيراد من المصدر.
 *
 * حقل linkOrKeywords يحمل كلمات بحث لا نطاقاً، لأن هذه التطبيقات تتغيّر
 * روابطها بين المتاجر، فالبحث أدق من رابط قد يصبح معطوباً.
 */

import type { AutismTool } from './autismToolsBank';

export const ARABIC_NATIVE_TOOLS: AutismTool[] = [
  {
    id: 'communication_ar_01',
    domain: 'communication',
    goalCategory: 'تطوير التعبير اللفظي',
    goal: 'تطوير التعبير اللفظي',
    toolName: 'تطبيق أمل (Amal AAC)',
    toolType: 'تطبيق',
    platform: 'iOS/Android',
    targetAge: 'جميع الأعمار',
    level: 'جميع المستويات',
    description:
      'تطبيق تواصل بديل ومعزّز بلوحات رمزية وأصوات عربية، للأطفال غير الناطقين',
    linkOrKeywords: 'تطبيق أمل للتواصل البديل Amal AAC',
    notes: 'مجاني ومفتوح المصدر',
    languageSupport: 'ar',
  },
  {
    id: 'communication_ar_02',
    domain: 'communication',
    goalCategory: 'تطوير المفردات والمعجم',
    goal: 'تطوير المفردات',
    toolName: 'تطبيق كلمة (Kalima)',
    toolType: 'تطبيق',
    platform: 'iOS/Android',
    targetAge: '2-10',
    level: 'مبتدئ',
    description:
      'بطاقات مفردات عربية مصوّرة مع نطق واضح لتدريب التسمية والنطق',
    linkOrKeywords: 'تطبيق كلمة لتعليم المفردات العربية Kalima',
    notes: 'واجهة عربية بالكامل',
    languageSupport: 'ar',
  },
  {
    id: 'life_skills_ar_01',
    domain: 'life_skills',
    goalCategory: 'إدارة الوقت والروتين اليومي',
    goal: 'إدارة الوقت',
    toolName: 'تطبيق جدولي البصري',
    toolType: 'تطبيق',
    platform: 'Android/iOS',
    targetAge: '3-12',
    level: 'مبتدئ',
    description:
      'جدول روتين يومي مصوّر بالعربية يقسّم المهام خطوة خطوة مع تعزيز بصري',
    linkOrKeywords: 'تطبيق جدولي البصري الروتين اليومي عربي',
    notes: 'مناسب للجداول البصرية المنزلية',
    languageSupport: 'ar',
  },
  {
    id: 'academic_ar_01',
    domain: 'academic',
    goalCategory: 'الرياضيات الأساسية (العد والأرقام)',
    goal: 'العد والأرقام',
    toolName: 'عد الحروف والأرقام العربية',
    toolType: 'تطبيق',
    platform: 'iOS/Android',
    targetAge: '3-9',
    level: 'مبتدئ',
    description:
      'تدريب على الحروف والأرقام العربية بالعد والتتبع الصوتي للقراءة المبكرة',
    linkOrKeywords: 'تطبيق تعليم الحروف والأرقام العربية للأطفال',
    notes: 'يجمع القراءة المبكرة والحساب',
    languageSupport: 'ar',
  },
];
