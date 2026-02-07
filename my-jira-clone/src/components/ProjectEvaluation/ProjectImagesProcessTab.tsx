import { useState, useEffect } from "react";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { ProjectEvaluationService } from "../../service/projectEvaluation";
import { toast } from "sonner";
import type { ProjectImageDto, ProjectProcessDto } from "../../service/projectEvaluation";

interface ProjectImagesProcessTabProps {
  projectId: number;
  readonly?: boolean;
}

export default function ProjectImagesProcessTab({ projectId, readonly = false }: ProjectImagesProcessTabProps) {
  const [images, setImages] = useState<ProjectImageDto[]>([]);
  const [process, setProcess] = useState<ProjectProcessDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processDescription, setProcessDescription] = useState("");
  const [processOverview, setProcessOverview] = useState("");
  const [savingProcess, setSavingProcess] = useState(false);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load current user's data only
      const { getUserId } = await import("../../helper/auth");
      const userId = getUserId();
      
      const [imagesData, processData] = await Promise.all([
        ProjectEvaluationService.getImages(projectId, userId).catch(err => {
          console.error("Error loading images:", err);
          return [];
        }),
        ProjectEvaluationService.getProcess(projectId, userId).catch(err => {
          console.error("Error loading process:", err);
          return null;
        }),
      ]);
      setImages(Array.isArray(imagesData) ? imagesData : []);
      if (processData) {
        setProcess(processData);
        setProcessDescription(processData.processDescription || "");
        setProcessOverview(processData.processOverview || "");
      } else {
        // Reset to empty if no process data for current user
        setProcessDescription("");
        setProcessOverview("");
      }
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const imageFiles = Array.from(files).filter(file => file.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      toast.error("Vui lòng chọn file hình ảnh");
      return;
    }

    try {
      setUploading(true);
      const uploadPromises = imageFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('ProjectId', projectId.toString());
        formData.append('Image', file);
        
        return await ProjectEvaluationService.createImage(formData);
      });

      const uploadedImages = await Promise.all(uploadPromises);
      setImages([...images, ...uploadedImages]);
      toast.success(`Đã thêm ${uploadedImages.length} hình ảnh thành công`);
    } catch (error: any) {
      console.error("Error uploading images:", error);
      toast.error("Không thể thêm hình ảnh");
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleDeleteImage = async (id: number) => {
    try {
      await ProjectEvaluationService.deleteImage(id);
      setImages(images.filter((img) => img.id !== id));
      toast.success("Xóa hình ảnh thành công");
    } catch (error: any) {
      console.error("Error deleting image:", error);
      toast.error("Không thể xóa hình ảnh");
    }
  };

  const handleSaveProcess = async () => {
    try {
      setSavingProcess(true);
      await ProjectEvaluationService.createOrUpdateProcess({
        projectId,
        processDescription,
        processOverview,
      });
      toast.success("Lưu quá trình thành công");
      await loadData();
    } catch (error: any) {
      console.error("Error saving process:", error);
      toast.error("Không thể lưu quá trình");
    } finally {
      setSavingProcess(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Panel - Images */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Hình ảnh dự án / プロジェクト画像
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Tải lên và quản lý hình ảnh từ các giai đoạn khác nhau
        </p>
        
        {!readonly && (
          <label className="block mb-4">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              disabled={uploading}
            />
            <div className="flex items-center justify-center w-full px-4 py-3 bg-slate-900 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
              {uploading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  <span>Đang tải lên...</span>
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 mr-2" />
                  <span>Thêm hình ảnh (có thể chọn nhiều)</span>
                </>
              )}
            </div>
          </label>
        )}

        {images.length === 0 ? (
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-12 text-center">
            <ImageIcon className="h-16 w-16 mx-auto text-slate-400 dark:text-slate-500 mb-4" />
            <p className="text-slate-500 dark:text-slate-400">Chưa có hình ảnh nào được thêm</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {images.map((image) => (
              <div key={image.id} className="relative group">
                <img
                  src={image.imageUrl}
                  alt={image.description || image.fileName || "Project image"}
                  className="w-full h-48 object-cover rounded-lg"
                />
                {!readonly && (
                  <button
                    onClick={() => handleDeleteImage(image.id)}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Panel - Process */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Mô tả quá trình / プロセス説明
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Mô tả quá trình triển khai dự án chi tiết
        </p>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Tổng quan quá trình / プロセス概要
          </label>
          <textarea
            value={processOverview}
            onChange={(e) => setProcessOverview(e.target.value)}
            placeholder="Mô tả quá trình triển khai, các bước thực hiện, các thách thức gặp phải và cách giải quyết..."
            className="w-full h-48 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            disabled={readonly}
            readOnly={readonly}
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Mô tả quá trình / プロセス説明
          </label>
          <textarea
            value={processDescription}
            onChange={(e) => setProcessDescription(e.target.value)}
            placeholder="Nhập mô tả chi tiết về quá trình..."
            className="w-full h-32 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            disabled={readonly}
            readOnly={readonly}
          />
        </div>

        {!readonly && (
          <button
            onClick={handleSaveProcess}
            disabled={savingProcess}
            className="w-full px-4 py-3 bg-slate-900 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
          {savingProcess ? (
            <span className="flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Đang lưu...
            </span>
          ) : (
            "Lưu quá trình"
          )}
        </button>
        )}
      </div>
    </div>
  );
}
