package com.company.transport_app.service;

public interface CrudService<R, T> {

    T create(R req);

    T list();

    T update(String id, R req);

    T getOne(String id);


}
