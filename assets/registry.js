/* Course registry. Load before any content file.
   A course file calls STUDY.course({...}) and stores the result in window.COURSE;
   the lecture files that follow it call COURSE.add({...}). */
window.STUDY = {
  courses: [],
  course(def) {
    const c = Object.assign({ unit: 'Lecture', lectures: [] }, def);
    c.add = l => { c.lectures.push(l); c.lectures.sort((a, b) => a.num - b.num); };
    this.courses.push(c);
    return c;
  }
};
