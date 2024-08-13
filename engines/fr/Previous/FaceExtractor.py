import facenet_pytorch
import cv2
import torch
from tqdm import tqdm

class FastMTCNN:
    def __init__(self, stride=4, resize=0.5, margin=14, factor=0.6, keep_all=True, device=None):
        self.stride = stride
        self.resize = resize
        self.device = device if device else ('cuda' if torch.cuda.is_available() else 'cpu')
        self.mtcnn = facenet_pytorch.MTCNN(margin=margin, factor=factor, keep_all=keep_all, device=self.device)

    def __call__(self, frames):
        if self.resize != 1:
            frames = [
                cv2.resize(f, (int(f.shape[1] * self.resize), int(f.shape[0] * self.resize)))
                for f in frames
            ]
        boxes, probs = self.mtcnn.detect(frames[::self.stride])
        faces = []
        for i, frame in enumerate(frames):
            box_ind = int(i / self.stride)
            if boxes[box_ind] is None:
                continue
            for box in boxes[box_ind]:
                box = [int(b) for b in box]
                faces.append(frame[box[1]:box[3], box[0]:box[2]])
        return faces

class FaceExtractor:
    def __init__(self):
        self.fast_mtcnn = FastMTCNN()
        self.mtcnn = facenet_pytorch.MTCNN(keep_all=True, device='cuda' if torch.cuda.is_available() else 'cpu')

    def extract_faces(self, images_with_labels):
        if images_with_labels is None or len(images_with_labels) == 0:
            print(f"No Loaded Images.")
            return []
        
        all_faces_with_labels = []
        
        # Use tqdm to add a progress bar
        for image, label in tqdm(images_with_labels, desc="Extracting faces", unit="image"):
            # Try to extract faces using FastMTCNN
            faces = self.fast_mtcnn([image])
            
            # If no faces are found, fall back to regular MTCNN
            if len(faces) == 0:
                boxes, probs = self.mtcnn.detect(image)
                faces = []
                if boxes is not None:
                    for box in boxes:
                        box = [int(b) for b in box]
                        faces.append(image[box[1]:box[3], box[0]:box[2]])
            
            # Append faces with their labels to the result list
            for face in faces:
                all_faces_with_labels.append((face, label))
        
        return all_faces_with_labels
