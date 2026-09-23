import ConsultantScientificReviewForm from '@/components/consultant/ConsultantScientificReviewForm';

export const metadata = {
  title: 'المراجعة العلمية — غرفة المستشار',
  robots: { index: false, follow: false },
};

export default function ConsultantReviewPage() {
  return <ConsultantScientificReviewForm />;
}
