//API.ts

import axios from 'axios';

const API_URL = 'https://backend-ai-cloud-explains.onrender.com';

interface FileInfoResponse {
  success: boolean;
  content?: string;
  error?: string;
}

interface ExplanationResponse {
  success: boolean;
  tag: string;
  explanation: string;
  message: string;
}

interface GetExplanationsResponse {
  success: boolean;
  explanations: Array<{
    concept: string;
    explanation: string;
    tag: string;
  }>;
  message: string;
}

interface SaveFileResponse {
  success: boolean;
  error?: string;
}

export const getFileInfo = async (userId: string, filename: string): Promise<FileInfoResponse> => {
  try {
    const response = await axios.post(`${API_URL}/note/get_file_info`, {
      user_id: userId,
      filename
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching file info:', error);
    return { success: false, error: 'Failed to fetch file info' };
  }
};

export const generateConceptExplanation = async (
  userId: string,
  filename: string,
  concept: string,
  occurrence: number = 1,
  mode: string = 'fast'
): Promise<ExplanationResponse> => {
  try {
    const response = await axios.post(`${API_URL}/note/generate_concept_explanation`, {
      user_id: userId,
      filename,
      concept,
      occurrence,
      mode
    });
    return response.data;
  } catch (error) {
    console.error('Error generating explanation:', error);
    return { success: false, tag: '', explanation: '', message: 'Failed to generate explanation' };
  }
};

export const getExplanationsPerConcept = async (
  userId: string,
  filename: string
): Promise<GetExplanationsResponse> => {
  try {
    const response = await axios.post(`${API_URL}/note/get_explanation_per_concept`, {
      user_id: userId,
      filename
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching explanations:', error);
    return { success: false, explanations: [], message: 'Failed to fetch explanations' };
  }
};

export const saveFile = async (
  userId: string,
  filename: string,
  content: string
): Promise<SaveFileResponse> => {
  try {
    const response = await axios.post(`${API_URL}/note/save_file`, {
      user_id: userId,
      filename,
      content
    });
    return response.data;
  } catch (error) {
    console.error('Error saving file:', error);
    return { success: false, error: 'Failed to save file' };
  }
};