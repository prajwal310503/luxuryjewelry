import VendorLayout from '../components/VendorLayout';
import AdminAddProduct from '../../admin/pages/AddProduct';

/** Same full product form as admin — submitted for review via vendor APIs. */
export default function VendorAddProduct() {
  return (
    <VendorLayout>
      <div className="p-4 md:p-6 overflow-y-auto h-full">
        <AdminAddProduct mode="vendor" />
      </div>
    </VendorLayout>
  );
}
