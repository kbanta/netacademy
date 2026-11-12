/* Your own videos and audio for each lesson.
   1. Copy the file into this "media" folder (MP4/WebM for video, MP3/OGG/M4A for audio).
   2. Add an entry under the lesson id below.
   3. Refresh the page: a "Videos & audio" section appears at the top of that lesson.

   Lesson ids: basics, osi, transport, ipv4, subnetting, ipv6, cabling, termination, rack, structured, ios, switching, arp, vlan,
               intervlan, stp, etherchannel, wireless, routing, ospf, dhcp, dns, nat, acl,
               ad-intro, ad-dns, kerberos, gpo, ad-groups, ad-replication
               (ids with a dash need quotes:  'ad-intro': [ ... ])

   Fields: src (required), title, type ('video' or 'audio', guessed from the extension), poster (image shown before play)
*/
window.LESSON_MEDIA = {
  // vlan: [
  //   { src: 'media/vlan-lecture.mp4', title: 'VLANs explained (my class recording)' },
  //   { src: 'media/vlan-podcast.mp3', title: 'Audio review: access vs trunk ports' }
  // ],
  // subnetting: [
  //   { src: 'media/subnetting-walkthrough.mp4', title: 'Subnetting in 5 minutes', poster: 'media/subnet-thumb.jpg' }
  // ]
};
