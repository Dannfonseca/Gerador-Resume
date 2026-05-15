import { useState, useEffect } from 'react';
import {
  JOB_PIPELINE_STORAGE_KEY,
  addJobToList,
  addResumeToJobList,
  createJob,
  deleteJobFromList,
  deleteResumeFromJobList,
  resetStaleProcessingJobs,
  updateJobInList,
  updateResumeInJobList,
} from './jobPipelineStorage';

export function useJobPipeline() {
  const [jobs, setJobs] = useState(() => {
    try {
      const item = window.localStorage.getItem(JOB_PIPELINE_STORAGE_KEY);
      return resetStaleProcessingJobs(item ? JSON.parse(item) : []);
    } catch (error) {
      console.warn('Error reading localStorage', error);
      return [];
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(JOB_PIPELINE_STORAGE_KEY, JSON.stringify(jobs));
    } catch (error) {
      console.warn('Error saving to localStorage', error);
    }
  }, [jobs]);

  const addJob = (job) => {
    const created = createJob(job);
    setJobs((prev) => addJobToList(prev, created));
    return created.id;
  };

  const updateJob = (id, updates) => {
    setJobs((prev) => updateJobInList(prev, id, updates));
  };

  const deleteJob = (id) => {
    setJobs((prev) => deleteJobFromList(prev, id));
  };

  const addResumeToJob = (jobId, resume) => {
    setJobs((prev) => addResumeToJobList(prev, jobId, resume));
  };

  const updateResumeForJob = (jobId, resumeId, updates) => {
    setJobs((prev) => updateResumeInJobList(prev, jobId, resumeId, updates));
  };

  const deleteResumeFromJob = (jobId, resumeId) => {
    setJobs((prev) => deleteResumeFromJobList(prev, jobId, resumeId));
  };

  return {
    jobs,
    addJob,
    updateJob,
    deleteJob,
    addResumeToJob,
    updateResumeForJob,
    deleteResumeFromJob,
  };
}
