import { JSDOM } from "jsdom";

async function getCourseData(courseId) {
  return await fetch(
    `https://coursehunter.net/api/v1/course/${courseId}/lessons`,
  )
    .then((res) => res.json())
    .catch((err) => {
      console.error(err);
      return false;
    });
}

async function parseCourseById(videoId) {
  const result = await fetch(`https://coursehunter.net/course/${videoId}`)
    .then((res) => res.text())
    .catch((err) => {
      console.error(err);
      return false;
    });

  if (!result) {
    return false;
  }

  const dom = new JSDOM(result);
  const doc = dom.window.document;

  return doc.querySelector('input[name="course_id"]')?.value;
}

async function getVideoData(videoId, lessonId = 1) {
  const courseId = await parseCourseById(videoId);
  if (!courseId) {
    return false;
  }

  const courseData = await getCourseData(courseId);
  if (!courseData) {
    return false;
  }

  const lessonData = courseData?.[lessonId - 1];

  const { file: videoUrl } = lessonData;

  return {
    url: videoUrl,
  };
}

export default {
  getCourseData,
  parseCourseById,
  getVideoData,
};
